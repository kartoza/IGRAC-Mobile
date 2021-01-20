/* eslint-disable @typescript-eslint/camelcase */
/* eslint-disable quote-props */
import Axios from "axios"
import { delay } from "../../utils/delay"
import { load, save } from "../../utils/storage"
import Well, { MeasurementType } from "../well/well"
import { Api } from "../../services/api/api"
import { saveWells, loadWells, getWellByField, getWellsByField, saveWellByField } from "../well/well.store"
import { GetWellResult } from "../../services/api"
import { any } from "ramda"
const { API_URL } = require("../../config/env")

export interface SyncData {
  id?: string | number,
  data?: any,
  url?: string,
  method?: string,
  wellPk: string | number,
  dataType: any
}

const isMeasurementData = (data: SyncData) => {
  return (
    data.dataType === MeasurementType.LevelMeasurements ||
    data.dataType === MeasurementType.QualityMeasurements ||
    data.dataType === MeasurementType.YieldMeasurements
  )
}

export const addUnsyncedData = async (data: SyncData) => {
  let storedUnsyncedData = await load("unsynced")
  if ("id" in data && data.id !== "") {
  } else {
    data.id = Date.now()
  }
  if (!storedUnsyncedData) {
    storedUnsyncedData = [data]
  } else {
    storedUnsyncedData.push(data)
  }
  await save("unsynced", storedUnsyncedData)
}

export const getUnsynced = async (): Promise<SyncData[]> => {
  return await load("unsynced") || []
}

// Move unsynced data to synced data
export const moveToSynced = async (unsyncedData: SyncData) => {
  let storedSyncedData = await load("synced")
  const storedUnsyncedData = await load("unsynced")
  if (!storedSyncedData) {
    storedSyncedData = {}
  }
  const convertMeasurementData = (_data) => {
    const _convertedData = {} as any
    _convertedData.id = _data.id
    _convertedData.datetime = _data.time
    _convertedData.parameter = _data.parameter
    _convertedData.methodology = _data.methodology
    _convertedData.value = _data.value_value
    _convertedData.unit = _data.value_unit
    return _convertedData
  }
  if (isMeasurementData(unsyncedData)) {
    unsyncedData.data = convertMeasurementData(unsyncedData.data)
  }
  if (!(unsyncedData.wellPk in storedSyncedData)) {
    storedSyncedData[unsyncedData.wellPk] = []
  }
  storedSyncedData[unsyncedData.wellPk].push(unsyncedData)
  await save("synced", storedSyncedData)
  storedUnsyncedData.forEach((element, index) => {
    if (element.id === unsyncedData.id) {
      storedUnsyncedData.splice(index, 1)
      return false
    }
    return true
  })
  await save("unsynced", storedUnsyncedData)
}

// Get synced data from storage
export const getSynced = async () => {
  return await load("synced") || {}
}

// Sync local data with the server
export interface SyncResult {
  synced: boolean,
  currentUnsyncedQueue?: any[]
}
export const pushUnsyncedData = async (unsyncedData: SyncData) => {
  const uuid = await load("uuid")
  const postData = {}
  const syncResult: SyncResult = {
    synced: true
  }
  const headers = {
    'Content-Type': 'application/json',
    'Authorization': `Token ${uuid}`
  }
  const dataType = unsyncedData.dataType.slice(0, -1) // measurements -> measurement
  if (isMeasurementData(unsyncedData)) {
    postData[dataType] = [unsyncedData.data]
  }
  await Axios.put(
    `${API_URL}${unsyncedData.url}`,
    JSON.stringify(postData),
    {
      headers: headers
    }
  ).then(async response => {
    if (isMeasurementData(unsyncedData)) {
      unsyncedData.data.id = response.data[dataType][0].id
    }
    await moveToSynced(unsyncedData)
  }).catch(error => {
    console.log(error)
    syncResult.synced = false
    return syncResult
  })

  return syncResult
}

/**
 * Push updated wells to remote server
 */
export const pushUnsyncedWells = async (wells: Well[] = []) => {
  if (wells.length === 0) {
    wells = await getWellsByField("synced", false)
  }
  const api = new Api()
  await api.setup()
  let status = true
  for (const well of wells) {
    const wellPk = well.pk
    let apiResult = {} as any
    if (well.new_data) {
      well.pk = ""
      apiResult = await api.postWell(well)
    } else {
      apiResult = await api.putWell(well)
    }
    if (apiResult.kind === "ok") {
      await saveWellByField('pk', wellPk, apiResult.well)
      status = true
      return true
    } else {
      status = false
      return false
    }
  }
  return status
}

export const mergeWithSynced = async (wells: Well[]) => {
  const synced = await getSynced()
  let wellsUpdated = false
  wells.forEach((well, index) => {
    if (well.pk in synced) {
      synced[well.pk].forEach((syncedData, sIndex) => {
        if (isMeasurementData(syncedData)) {
          const wellMeasurements = well[syncedData.dataType]
          let measurementDataFound = false
          wellMeasurements.forEach(measurement => {
            if (measurement.id === syncedData.data.id) {
              measurementDataFound = true
              synced[well.pk].splice(sIndex, 1)
              return false
            }
            return true
          })
          if (!measurementDataFound) {
            wellsUpdated = true
            wells[index].addMeasurementData(
              syncedData.dataType,
              syncedData.data)
          }
        }
      })
    }
  })
  await save("synced", synced)
  if (wellsUpdated) {
    await saveWells(wells)
  }
}

// Fetch well data from server, then merge it with local synced data
export const syncPullData = async(setSyncProgress: any, setSyncMessage: any, showError: any) => {
  const wells = await loadWells()
  const api = new Api()
  await api.setup()
  for (let i = 0; i < wells.length; i++) {
    setSyncMessage(`Updating records (${i + 1}/${wells.length})`)
    setSyncProgress((i + 1) / wells.length)
    const apiResult = await api.getWell(wells[i].pk)
    if (apiResult.kind === "ok") {
      wells[i] = apiResult.well
    } else {
      showError("One of the data can't be synchronized")
      return
    }
  }
  await delay(250)
  await mergeWithSynced(wells)
  setSyncMessage("All Done!")
  await saveWells(wells)
  await delay(250)
  return true
}
