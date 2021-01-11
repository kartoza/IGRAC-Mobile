export interface WellInterface {
  pk: number
  id: string
  name: string
  latitude: number
  longitude: number
  levelMeasurements: Measurement[]
  qualityMeasurements: Measurement[]
  yieldMeasurements: Measurement[]
}

export interface Measurement {
  id: number
  datetime: number
  parameter: string
  value: number
  unit: string
  methodology: string
}

export default class Well implements WellInterface {
    pk: number
    id: string
    name: string
    latitude: number
    longitude: number
    levelMeasurements: Measurement[]
    qualityMeasurements: Measurement[]
    yieldMeasurements: Measurement[]

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

      this.levelMeasurements = minimizedData.lm.map(convertMeasurement)
      this.qualityMeasurements = minimizedData.qm.map(convertMeasurement)
      this.yieldMeasurements = minimizedData.ym.map(convertMeasurement)
      return this
    }

    allMeasurements = () => {
      return {
        levelMeasurements: this.levelMeasurements,
        qualityMeasurements: this.qualityMeasurements,
        yieldMeasurements: this.yieldMeasurements
      }
    }

    constructor(well: WellInterface | any) {
      if (well) {
        this.id = well.id
        this.pk = well.pk
        this.name = well.name
        this.latitude = well.latitude
        this.longitude = well.longitude
        this.levelMeasurements = well.levelMeasurements || []
        this.qualityMeasurements = well.qualityMeasurements || []
        this.yieldMeasurements = well.yieldMeasurements || []
      }
    }
}
