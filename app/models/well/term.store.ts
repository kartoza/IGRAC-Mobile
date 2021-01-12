import { load, save } from "../../utils/storage"
import { MeasurementType } from "./well"

export const saveTerms = async (terms) => {
  await save("terms", terms)
}

export const loadTerms = async () => {
  return await load("terms") || {}
}
