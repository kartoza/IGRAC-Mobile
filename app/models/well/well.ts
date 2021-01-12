/* eslint-disable camelcase */
/* eslint-disable @typescript-eslint/camelcase */
import { addUnsyncedData } from "../sync/sync"

const LEVEL_MEASUREMENTS = "level_measurements"
const QUALITY_MEASUREMENTS = "quality_measurements"
const YIELD_MEASUREMENTS = "yield_measurements"

export interface WellInterface {
  pk: number
  id: string
  name: string
  latitude: number
  longitude: number
  level_measurements?: Measurement[]
  quality_measurements?: Measurement[]
  yield_measurements?: Measurement[]
}

export interface Measurement {
  id: number | string
  datetime: number
  parameter: string
  value: number
  unit: string
  methodology: string
}

export const MeasurementType = {
  LevelMeasurements: LEVEL_MEASUREMENTS,
  QualityMeasurements: QUALITY_MEASUREMENTS,
  YieldMeasurements: YIELD_MEASUREMENTS
}

export default class Well implements WellInterface {
    pk: number
    id: string
    name: string
    latitude: number
    longitude: number
    level_measurements: Measurement[]
    quality_measurements: Measurement[]
    yield_measurements: Measurement[]

    convertFromMinimizedData = (minimizedData) => {
      this.pk = minimizedData.pk
      this.id = minimizedData.id
      this.name = minimizedData.nm || ""
      this.latitude = minimizedData.loc[0]
      this.longitude = minimizedData.loc[1]

      const convertMeasurement = (measurementData) => {
        return {
          id: measurementData.id,
          datetime: measurementData.dt,
          parameter: measurementData.par,
          value: measurementData.v,
          unit: measurementData.u,
          methodology: measurementData.mt
        }
      }

      this.level_measurements = minimizedData.lm.map(convertMeasurement)
      this.quality_measurements = minimizedData.qm.map(convertMeasurement)
      this.yield_measurements = minimizedData.ym.map(convertMeasurement)
      return this
    }

    allMeasurements = () => {
      return {
        levelMeasurements: this.level_measurements,
        qualityMeasurements: this.quality_measurements,
        yieldMeasurements: this.yield_measurements
      }
    }

    addMeasurementData = async (
      measurementType = MeasurementType.LevelMeasurements,
      measurementData: Measurement) => {
      if (measurementType in this) {
        this[measurementType].push(measurementData)
      }
      if (measurementData.id === "") { // New data
        const unsynced = {
          id: "",
          time: measurementData.datetime,
          parameter: measurementData.parameter,
          methodology: measurementData.methodology || "",
          value_id: "",
          value_value: measurementData.value,
          value_unit: measurementData.unit || "m"
        }
        await addUnsyncedData({
          data: unsynced,
          url: `/groundwater/api/well/${this.pk}/edit`,
          method: 'POST',
          wellPk: this.pk,
          dataType: measurementType
        })
      }
    }

    constructor(well: WellInterface | any) {
      if (well) {
        this.id = well.id
        this.pk = well.pk
        this.name = well.name
        this.latitude = well.latitude
        this.longitude = well.longitude
        this.level_measurements = well.level_measurements || []
        this.quality_measurements = well.quality_measurements || []
        this.yield_measurements = well.yield_measurements || []
      }
    }
}
