/* eslint-disable camelcase */
/* eslint-disable @typescript-eslint/camelcase */
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

export default class Well {
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
    new_data?: boolean
    total_depth?: number | string
    total_depth_reference_elevation?: string
    construction_year?: number | string
    excavation_method?: string
    contractor?: string
    successful?: string
    cause_of_failure?: string
    aquifer_name?: string
    aquifer_material?: string
    aquifer_type?: string
    aquifer_thickness?: string
    confinement?: string
    porosity?: string
    hydraulic_conductivity?: string
    hydraulic_conductivity_unit?: string
    hydraulic_conductivity_unit_key?: string = "length / time"
    transmissivity?: string
    transmissivity_unit?: string
    transmissivity_unit_key?: string = "length^2 / time"
    specific_storage?: string
    specific_storage_unit?: string
    specific_storage_unit_key?: string = "1 / length"
    specific_yield?: string
    specific_capacity?: string
    specific_capacity_unit?: string
    specific_capacity_unit_key?: string = "length^2 / time"
    yield?: string
    yield_unit?: string
    yield_unit_key?: string = "length^3 / time"
    test_type?: string
    editable?: boolean

    convertFromMinimizedData = (minimizedData) => {
      const splitValueAndUnit = data => {
        if (typeof data === "undefined") {
          return ["", ""]
        }
        const _allValues = data.split(" ")
        if (_allValues.length > 1) {
          return _allValues
        } else {
          return [data, ""]
        }
      }
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
      this.total_depth = minimizedData.dtd
      this.construction_year = minimizedData.dy
      this.excavation_method = minimizedData.ddm
      this.contractor = minimizedData.dd
      this.successful = minimizedData.ds
      this.cause_of_failure = minimizedData.dr
      this.total_depth_reference_elevation = minimizedData.dtdre
      this.synced = true
      this.new_data = false
      this.aquifer_name = minimizedData.an
      this.aquifer_material = minimizedData.am
      this.aquifer_type = minimizedData.at
      this.aquifer_thickness = minimizedData.atn
      this.confinement = minimizedData.ac
      this.porosity = minimizedData.hp
      const hydraulic_conductivity = splitValueAndUnit(minimizedData.hc)
      this.hydraulic_conductivity = hydraulic_conductivity[0]
      this.hydraulic_conductivity_unit = hydraulic_conductivity[1]
      const transmissivity = splitValueAndUnit(minimizedData.ht)
      this.transmissivity = transmissivity[0]
      this.transmissivity_unit = transmissivity[1]
      const specific_storage = splitValueAndUnit(minimizedData.hss)
      this.specific_storage = specific_storage[0]
      this.specific_storage_unit = specific_storage[1]
      const specific_capacity = splitValueAndUnit(minimizedData.hsc)
      this.specific_capacity = specific_capacity[0]
      this.specific_capacity_unit = specific_capacity[1]
      this.specific_yield = minimizedData.hsy
      const yieldValue = splitValueAndUnit(minimizedData.hs)
      this.yield = yieldValue[0]
      this.yield_unit = yieldValue[1]
      this.test_type = minimizedData.htt
      if (minimizedData.editable === "Yes") {
        this.editable = true
      } else {
        this.editable = false
      }

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

    constructor(well: any) {
      if (well) {
        for (const key in well) {
          this[key] = well[key]
        }
        if (this.new_data && typeof well.synced === "undefined") {
          this.synced = true
        }
        this.level_measurements = well.level_measurements || []
        this.quality_measurements = well.quality_measurements || []
        this.yield_measurements = well.yield_measurements || []
      }
    }
}
