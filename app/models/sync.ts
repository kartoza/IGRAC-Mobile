/* eslint-disable quote-props */
import Axios from "axios"
import { delay } from "../utils/delay"
import { load, save } from "../utils/storage"
const { API_URL } = require("../config/env")

export const addToQueue = async (data: any) => {
  let storeQueueData = await load("queue")
  if ("id" in data) {
  } else {
    data.id = Date.now()
  }
  if (!storeQueueData) {
    storeQueueData = [data]
  } else {
    storeQueueData.push(data)
  }
  await save("queue", storeQueueData)
}

export const removeFromQueue = async (data: object) => {
}

export const getQueue = async () => {
  return await load("queue")
}

export const getTotalQueue = async () => {
  const queueData = await load("queue")
  if (!queueData) {
    return 0
  }
  return queueData.length
}

// Sync local data with the server
export interface SyncResult {
  synced: boolean,
  currentUnsyncedQueue: any[]
}
export const syncQueue = async (data, allUnsyncedData = []) => {
  if (allUnsyncedData.length === 0) {
    allUnsyncedData = await load("queue")
  }
  const wells = await load("wells")
  const uuid = await load("uuid")
  const syncResult: SyncResult = {
    synced: true,
    currentUnsyncedQueue: allUnsyncedData
  }
  const headers = {
    'Content-Type': 'application/json',
    'Authorization': `Token ${uuid}`
  }
  await Axios.put(
    data.url,
    JSON.stringify(data.data),
    {
      headers: headers
    }
  ).then(async response => {
    console.log(response)
    for (let i = 0; i < allUnsyncedData.length; i++) {
      if (allUnsyncedData[i].id === data.id) {
        allUnsyncedData.splice(i, 1)
        syncResult.currentUnsyncedQueue = allUnsyncedData
      }
    }
    for (let w = 0; w < wells.length; w++) {
      const _well = wells[w]
      if (_well.pk === data.pk) {
        const wellDataToUpdate = _well[data.dataType] || []
        wells[w][data.dataType] = wellDataToUpdate.map((dataToUpdate) => {
          if ("tempId" in dataToUpdate) {
            if (dataToUpdate.tempId === data.data.tempId) {
              const _data = response.data[data.dataType][0]
              _data.local = true
              return _data
            }
          }
          return dataToUpdate
        })
      }
    }
    await save("queue", allUnsyncedData)
  }).catch(error => {
    console.log(error)
    syncResult.synced = false
    return syncResult
  })

  await save("wells", wells)
  return syncResult
}

export const syncPullData = async(setSyncProgress: any, setSyncMessage: any) => {
  const wells = await load("wells")
  const uuid = await load("uuid")
  const headers = {
    'Content-Type': 'application/json',
    'Authorization': `Token ${uuid}`
  }
  for (let i = 0; i < wells.length; i++) {
    setSyncMessage(`Updating records (${i + 1}/${wells.length})`)
    setSyncProgress((i + 1) / wells.length)
    const url = `${API_URL}/groundwater/api/well/minimized/?limit=${wells.length}&pks=${wells[i].pk}`
    await Axios.get(url, {
      headers
    }).then(res => {
      wells[i] = res.data.wells[0]
    })
  }
  await delay(250)
  setSyncMessage("All Done!")
  await save("wells", wells)
  await delay(250)
  return true
}
