/* eslint-disable @typescript-eslint/camelcase */
import Well, { MeasurementType, Measurement } from "./well"
import { getWellByField, loadWells, saveWells, updateWellMeasurement, saveWellByField, createNewWell, clearTemporaryNewWells, getWellsByField, removeWellsByField } from "./well.store"

const minimizedData = {
  id: "1",
  pk: 1,
  nm: "test",
  loc: [
    1,
    1
  ],
  lm: [{
    id: 1,
    dt: 1,
    par: "",
    v: 100,
    u: "m",
    mt: ""
  }],
  qm: [],
  ym: []
}

const well = new Well({}).convertFromMinimizedData(minimizedData)

it("converts from minimized data", () => {
  expect(well.name).toBe("test")
})

it("converts measurements data", () => {
  expect(well.level_measurements[0].value).toBe(100)
})

it("stores the wells", async () => {
  const wells = [well]
  await saveWells(wells)
  const storedWells = await loadWells()
  expect(storedWells[0].name).toBe(wells[0].name)
})

it("saves the well by field", async() => {
  const wells = await loadWells()
  wells[0].name = "updated"
  await saveWellByField("pk", wells[0].pk, wells[0])
  const updatedWells = await loadWells()
  expect(updatedWells[0].name).toBe("updated")
})

it("gets well by field", async() => {
  const wells = [well]
  await saveWells(wells)
  const _well = await getWellByField("id", "1")
  expect(_well.name).toBe("test")
})

it("adds new measurement data", async () => {
  const measurementData: Measurement = {
    id: "",
    datetime: 123,
    methodology: "methodology",
    parameter: "parameter",
    value: 100,
    unit: "m"
  }
  await well.addMeasurementData(
    MeasurementType.LevelMeasurements,
    measurementData)
  expect(well.level_measurements[1].datetime).toBe(measurementData.datetime)
})

it("updates well measurement data", async () => {
  const measurementData: Measurement = {
    id: "",
    datetime: 134,
    methodology: "methodology",
    parameter: "parameter",
    value: 100,
    unit: "m"
  }
  await updateWellMeasurement(
    minimizedData.pk,
    measurementData,
    MeasurementType.LevelMeasurements
  )
  const updatedWell = await getWellByField('pk', minimizedData.pk)
  expect(updatedWell.level_measurements[1].datetime).toBe(measurementData.datetime)
})

it("creates new well", async () => {
  const wells = await loadWells()
  wells.push(new Well({ pk: -1, latitude: 0, longitude: 0, new_data: true }))
  wells.push(new Well({ pk: -3, latitude: 0, longitude: 0, new_data: true }))
  await saveWells(wells)
  const newWell = await createNewWell(0, 0)
  expect(newWell.pk).toBe(-4)
  expect(newWell.new_data).toBe(true)
})

it("clears temporary well", async () => {
  const newWells = await getWellsByField('new_data', true)
  expect(newWells.length).toBe(3)
  // Delete all temporary wells
  const deleted = await clearTemporaryNewWells()
  expect(deleted).toBe(true)
  // Check the new wells
  const newWells2 = await getWellsByField('new_data', true)
  expect(newWells2.length).toBe(0)
})

it("removes wells by field", async () => {
  const wells = await loadWells()
  wells.push(new Well({ pk: -1, latitude: 0, longitude: 0, new_data: false }))
  wells.push(new Well({ pk: -3, latitude: 0, longitude: 0, new_data: false }))
  await saveWells(wells)
  const wellsWithoutCoordinate = await getWellsByField('latitude', 0)
  expect(wellsWithoutCoordinate.length).toBe(2)
  const deleted = await removeWellsByField('latitude', 0)
  expect(deleted).toBe(true)
  const wellsWithoutCoordinate2 = await getWellsByField('latitude', 0)
  expect(wellsWithoutCoordinate2.length).toBe(0)
})
