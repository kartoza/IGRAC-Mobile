/* eslint-disable @typescript-eslint/camelcase */
import Well from "./well"
import { getWellByField, loadWells, saveWells } from "./well.store"

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

it("converts from minimized data", () => {
  const well = new Well({}).convertFromMinimizedData(minimizedData)
  expect(well.name).toBe("test")
})

it("converts measurements data", () => {
  const well = new Well({}).convertFromMinimizedData(minimizedData)
  expect(well.levelMeasurements[0].value).toBe(100)
})

it("stores the wells", async () => {
  const wells = [new Well({}).convertFromMinimizedData(minimizedData)]
  await saveWells(wells)
  const storedWells = await loadWells()
  expect(storedWells[0].name).toBe(wells[0].name)
})

it("gets well by field", async() => {
  const wells = [new Well({}).convertFromMinimizedData(minimizedData)]
  await saveWells(wells)
  const well = await getWellByField("id", "1")
  expect(well.name).toBe("test")
})
