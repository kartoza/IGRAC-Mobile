/* eslint-disable quote-props */
import Axios from "axios"
import { delay } from "../utils/delay"
import { load, save } from "../utils/storage"

export const addToQueue = async (data: any) => {
  let queueData = await load("queue")
  if ("id" in data) {
  } else {
    data.id = Date.now()
  }
  if (!queueData) {
    queueData = [data]
  } else {
    queueData.push(data)
  }
  await save("queue", queueData)
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
export const syncQueue = async (data, allData = []) => {
  if (allData.length === 0) {
    allData = await load("queue")
  }
  const uuid = await load("uuid")
  const syncResult: SyncResult = {
    synced: true,
    currentUnsyncedQueue: allData
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
    for (let i = 0; i < allData.length; i++) {
      if (allData[i].id === data.id) {
        allData.splice(i, 1)
        syncResult.currentUnsyncedQueue = allData
      }
    }
    await save("queue", allData)
  }).catch(error => {
    console.log(error)
    syncResult.synced = false
    return syncResult
  })

  return syncResult
}
