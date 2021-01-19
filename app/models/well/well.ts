/* eslint-disable camelcase */
/* eslint-disable @typescript-eslint/camelcase */
import { addUnsyncedData } from "../sync/sync"
import * as RNLocalize from 'react-native-localize'
import moment from 'moment-timezone'

const LEVEL_MEASUREMENTS = "level_measurements"
const QUALITY_MEASUREMENTS = "quality_measurements"
const YIELD_MEASUREMENTS = "yield_measurements"

export const formatTimeByOffset = (dateObject, offset) => {
  // Add the offset to the date object
  dateObject.setHours(dateObject.getHours() + offset)
  return dateObject.toGMTString()
}

export interface WellInterface {
  pk: number
  id: string
  synced: boolean
  name: string
  last_update?: string
  organisation?: string
  status?: string
  feature_type?: string
  purpose?: string
  country?: string
  description?: string
  address?: string
  latitude: number
  longitude: number
  ground_surface_elevation?: number
  top_borehole_elevation?: number
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
    synced: boolean
    organisation?: string
    status?: string
    feature_type?: string
    country?: string
    last_update?: string
    address?: string
    purpose?: string
    description?: string
    ground_surface_elevation?: number
    top_borehole_elevation?: number
    level_measurements: Measurement[]
    quality_measurements: Measurement[]
    yield_measurements: Measurement[]

    convertFromMinimizedData = (minimizedData) => {
      this.pk = minimizedData.pk
      this.id = minimizedData.id
      this.name = minimizedData.nm || ""
      this.latitude = minimizedData.loc[0]
      this.longitude = minimizedData.loc[1]
      this.organisation = minimizedData.org
      this.purpose = minimizedData.p
      this.feature_type = minimizedData.ft
      this.description = minimizedData.dsc
      this.status = minimizedData.st
      this.country = minimizedData.c
      this.address = minimizedData.adr
      this.ground_surface_elevation = minimizedData.gse
      this.top_borehole_elevation = minimizedData.tbe
      this.synced = true

      try {
        const deviceTimeZone = RNLocalize.getTimeZone()
        const today = moment().tz(deviceTimeZone)
        const currentTimeZoneOffsetInHours = today.utcOffset() / 60
        this.last_update = formatTimeByOffset(
          new Date(),
          currentTimeZoneOffsetInHours,
        )
      } catch (e) {
        this.last_update = new Date().toLocaleDateString()
      }

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
    }

    constructor(well: WellInterface | any) {
      if (well) {
        this.id = well.id
        this.pk = well.pk
        this.country = well.country
        this.name = well.name
        this.latitude = well.latitude
        this.longitude = well.longitude
        this.organisation = well.organisation
        this.purpose = well.purpose
        this.feature_type = well.feature_type
        this.description = well.description
        this.status = well.status
        this.address = well.address
        this.last_update = well.last_update
        this.synced = well.synced
        this.ground_surface_elevation = well.ground_surface_elevation
        this.top_borehole_elevation = well.top_borehole_elevation
        this.level_measurements = well.level_measurements || []
        this.quality_measurements = well.quality_measurements || []
        this.yield_measurements = well.yield_measurements || []
      }
    }
}
