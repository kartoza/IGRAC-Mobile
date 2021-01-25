/* eslint-disable @typescript-eslint/camelcase */
import { load, save } from "../../utils/storage"
import Well from "./well"

export const loadWells = async () => {
  const wells = await load("wells")
  if (!wells) {
    return []
  }
  return wells.map((well) => new Well(well))
}

export const saveWells = async (wells) => {
  await save("wells", wells)
}

export const getWellByField = async (field: string, value: any): Promise<Well> => {
  const wells = await load("wells")
  let well = null
  if (wells) {
    for (const index in wells) {
      const _well = wells[index]
      if (_well[field] === value) {
        well = _well
      }
    }
  }
  if (well) {
    return new Well(well)
  }
  return well
}

export const getWellsByField = async (field: string, value: any): Promise<Well[]> => {
  const wells = await load("wells")
  const _wells = []
  if (wells) {
    for (const index in wells) {
      const _well = wells[index]
      if (_well[field] === value) {
        _wells.push(new Well(_well))
      }
    }
  }
  return _wells
}

export const saveWellByField = async (
  queryField: string,
  queryFieldValue: any,
  wellData: Well) => {
  const wells = await load("wells")
  if (wells) {
    for (const index in wells) {
      const _well = wells[index]
      if (_well[queryField] === queryFieldValue) {
        wells[index] = wellData
        break
      }
    }
  }
  await saveWells(wells)
}

export const updateWellMeasurement = async (
  wellPk: any,
  measurementData,
  measurementType) => {
  const well = await getWellByField("pk", wellPk)
  await well.addMeasurementData(measurementType, measurementData)
  await saveWellByField("pk", well.pk, well)
}

export const createNewWell = async (latitude: number, longitude: number) => {
  const newWells = await getWellsByField('new_data', true)
  let newPk = -1
  if (newWells.length > 0) {
    // sort by pk
    newWells.sort((a, b) => a.pk - b.pk)
    newPk = newWells[0].pk - 1
  }
  const newWell = new Well({
    pk: newPk,
    latitude: latitude,
    longitude: longitude,
    new_data: true,
    datetime: Math.floor(Date.now() / 1000)
  })
  const allWells = await loadWells()
  allWells.push(newWell)
  await saveWells(allWells)
  return newWell
}

export const clearTemporaryNewWells = async () => {
  const wells = await loadWells()
  const removedIndex = []
  if (wells) {
    for (const index in wells) {
      const _well = wells[index]
      if (_well.new_data === true && _well.synced === true) {
        removedIndex.push(index)
      }
    }
  }
  if (removedIndex.length > 0) {
    for (let i = removedIndex.length - 1; i >= 0; i--) {
      wells.splice(removedIndex[i], 1)
    }
    await saveWells(wells)
  }
  return removedIndex.length > 0
}
