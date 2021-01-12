/* eslint-disable @typescript-eslint/camelcase */
import { save } from "../../utils/storage"
import { MeasurementType, WellInterface } from "../well/well"
import { loadWells, saveWells } from "../well/well.store"
import { addUnsyncedData, getSynced, getUnsynced, moveToSynced, mergeWithSynced } from "./sync"

const unsynced = {
  identifier: "test",
  wellPk: 1,
  dataType: MeasurementType.LevelMeasurements,
  data: {
    id: "",
    time: 15000000,
    parameter: "1",
    methodology: "12",
    value_id: "",
    value_value: "",
    value_unit: "m"
  }
}

it("adds to unsynced data", async () => {
  await addUnsyncedData(unsynced)
  const allUnsynced = await getUnsynced()
  expect(allUnsynced[0].identifier).toBe(unsynced.identifier)
  expect(allUnsynced[0].id).not.toBe(null)
})

it("moves unsynced to synced", async () => {
  const allUnsynced = await getUnsynced()
  await moveToSynced(allUnsynced[0])
  const allSynced = await getSynced()
  expect(allSynced[unsynced.wellPk][0].data.value).toBe(unsynced.data.value_value)
  const updatedAllUnsynced = await getUnsynced()
  expect(updatedAllUnsynced.length).toBe(0)
})

it("merges remote data with stored local data", async() => {
  await save("synced", {
    1: [{
      wellPk: 1,
      dataType: MeasurementType.LevelMeasurements,
      id: 1234,
      data: {
        id: 3,
        datetime: 10000,
        parameter: "1",
        methodology: "",
        value: 0,
        unit: "m"
      }
    }, {
      wellPk: 1,
      dataType: MeasurementType.LevelMeasurements,
      id: 1234,
      data: {
        id: 2,
        datetime: 500,
        parameter: "1",
        methodology: "",
        value: 0,
        unit: "m"
      }
    }]
  })
  const well: WellInterface = {
    pk: 1,
    id: '1',
    name: 'test',
    latitude: 1,
    longitude: 1,
    level_measurements: [{
      id: 2,
      datetime: 111,
      parameter: '',
      methodology: '',
      value: 10,
      unit: ''
    }]
  }
  await saveWells([well])
  await mergeWithSynced(await loadWells())
  const wells = await loadWells()
  const synced = await getSynced()
  expect(synced['1'].length).toBe(1)
  expect(wells[0].level_measurements.length).toBe(2)
})
