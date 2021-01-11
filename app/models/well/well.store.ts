import { load, save } from "../../utils/storage"
import Well from "./well"

export const loadWells = async () => {
  const wells = await load("wells")
  return wells.map((well) => new Well(well))
}

export const saveWells = async (wells) => {
  await save("wells", wells)
}

export const getWellByField = async (field, value) => {
  const wells = await load("wells")
  let well = null
  wells.forEach((_well, index) => {
    if (_well[field] === value) {
      well = _well
      return false
    }
    return true
  })
  if (well) {
    return new Well(well)
  }
  return well
}
