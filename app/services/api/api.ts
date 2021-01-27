/* eslint-disable @typescript-eslint/camelcase */
import { ApisauceInstance, create, ApiResponse } from "apisauce"
import { getGeneralApiProblem } from "./api-problem"
import { ApiConfig, DEFAULT_API_CONFIG } from "./api-config"
import * as Types from "./api.types"
import { load } from "../../utils/storage"
import Well from "../../models/well/well"
import { loadTerms } from "../../models/well/term.store"
import { LIMIT } from "@env"

/**
 * Manages all requests to the API.
 */
export class Api {
  /**
   * The underlying apisauce instance which performs the requests.
   */
  apisauce: ApisauceInstance

  /**
   * Configurable options.
   */
  config: ApiConfig

  /**
   * Creates the api.
   *
   * @param config The configuration to use.
   */
  constructor(config: ApiConfig = DEFAULT_API_CONFIG) {
    this.config = config
  }

  /**
   * Sets up the API.  This will be called during the bootup
   * sequence and will happen before the first React component
   * is mounted.
   *
   * Be as quick as possible in here.
   */
  async setup() {
    // construct the apisauce instance
    const uuid = await load("uuid")
    this.apisauce = create({
      baseURL: this.config.url,
      timeout: this.config.timeout,
      headers: {
        Accept: "application/json",
        Authorization: `Token ${uuid}`
      },
    })
  }

  /**
   * Gets a list of users.
   */
  async getUsers(): Promise<Types.GetUsersResult> {
    // make the api call
    const response: ApiResponse<any> = await this.apisauce.get(`/users`)

    // the typical ways to die when calling an api
    if (!response.ok) {
      const problem = getGeneralApiProblem(response)
      if (problem) return problem
    }

    const convertUser = (raw) => {
      return {
        id: raw.id,
        name: raw.name,
      }
    }

    // transform the data into the format we are expecting
    try {
      const rawUsers = response.data
      const resultUsers: Types.User[] = rawUsers.map(convertUser)
      return { kind: "ok", users: resultUsers }
    } catch {
      return { kind: "bad-data" }
    }
  }

  /**
   * Gets a single user by ID
   */

  async getUser(id: string): Promise<Types.GetUserResult> {
    // make the api call
    const response: ApiResponse<any> = await this.apisauce.get(`/users/${id}`)

    // the typical ways to die when calling an api
    if (!response.ok) {
      const problem = getGeneralApiProblem(response)
      if (problem) return problem
    }

    // transform the data into the format we are expecting
    try {
      const resultUser: Types.User = {
        id: response.data.id,
        name: response.data.name,
      }
      return { kind: "ok", user: resultUser }
    } catch {
      return { kind: "bad-data" }
    }
  }

  /**
   * Get a list of wells
   */
  async getWells(latitude = "", longitude = ""): Promise<Types.GetWellsResult> {
    // make the api call
    const limit = LIMIT ? `limit=${LIMIT}` : ''
    let userCoordinate = ""
    if (latitude && longitude) {
      userCoordinate = `${latitude}&lon=${longitude}`
    }
    const response: ApiResponse<any> = await this.apisauce.get(
      `/groundwater/api/well/minimized?${userCoordinate}&${limit}`
    )

    // the typical ways to die when calling an api
    if (!response.ok) {
      const problem = getGeneralApiProblem(response)
      if (problem) return problem
    }

    // transform the data into the format we are expecting
    try {
      const rawData = response.data
      const resultWells: Well[] = rawData.results.map((raw) => new Well({}).convertFromMinimizedData(raw))
      return { kind: "ok", wells: resultWells, terms: rawData.terms }
    } catch {
      return { kind: "bad-data" }
    }
  }

  /**
   * Gets a single well by ID
   */

  async getWell(id: string): Promise<Types.GetWellResult> {
    // make the api call
    const response: ApiResponse<any> = await this.apisauce.get(`/groundwater/api/well/minimized/?limit=2&pks=${id}`)

    // the typical ways to die when calling an api
    if (!response.ok) {
      const problem = getGeneralApiProblem(response)
      if (problem) return problem
    }

    // transform the data into the format we are expecting
    try {
      const raw = response.data
      return { kind: "ok", well: new Well({}).convertFromMinimizedData(raw.results[0]) }
    } catch {
      return { kind: "bad-data" }
    }
  }

  /**
   * Parse well data to post data
   */
  parseWell(well: Well, terms: any): {} {
    const postData = {
      general_information: {},
      level_measurement: [],
      quality_measurement: [],
      yield_measurement: [],
      well_metadata: {},
      geology: {},
      drilling: {},
      hydrogeology: {}
    }
    const parseMeasurementData = (measurementType, postType) => {
      well[measurementType].forEach(measurementData => {
        postData[postType].push({
          id: measurementData.id,
          time: measurementData.datetime,
          parameter: measurementData.parameter,
          methodology: measurementData.methodology,
          value_value: measurementData.value,
          value_unit: measurementData.unit
        })
      })
    }
    const getTermId = (termValue, termKey) => {
      let id = ""
      // if value undefined, then return the first value
      if (typeof termValue === "undefined") {
        return Object.keys(terms[termKey][0])[0]
      }
      terms[termKey].forEach(_term => {
        if (_term[Object.keys(_term)[0]] === termValue) {
          id = Object.keys(_term)[0]
          return false
        }
        return true
      })
      return id
    }
    const getUnitValue = (value, unitValue, unitKey) => {
      if (value && !unitValue) {
        if (terms[unitKey]) {
          return terms[unitKey][0]
        }
        return ""
      }
      return unitValue
    }
    postData.general_information = {
      original_id: well.id,
      name: well.name || "",
      feature_type: getTermId(well.feature_type, 'termfeaturetype') || "",
      purpose: getTermId(well.purpose, 'termwellpurpose') || "",
      status: getTermId(well.status, 'termwellstatus') || "",
      description: well.description || "",
      latitude: well.latitude,
      longitude: well.longitude,
      ground_surface_elevation_value: well.ground_surface_elevation,
      ground_surface_elevation_unit: "m",
      top_borehole_elevation_value: well.top_borehole_elevation,
      top_borehole_elevation_unit: "m",
      country: well.country || "",
      address: well.address || ""
    }
    postData.well_metadata = {
      organisation: getTermId(well.organisation, 'organisation') || ""
    }
    postData.drilling = {
      year_of_drilling: well.construction_year || "",
      drilling_method: getTermId(well.excavation_method, 'termdrillingmethod') || "",
      driller: well.contractor,
      cause_of_failure: well.cause_of_failure,
      successful: well.successful
    }
    postData.geology = {
      total_depth_value: well.total_depth || "",
      total_depth_unit: "m",
      reference_elevation: getTermId(well.total_depth_reference_elevation, 'termreferenceelevationtype') || ""
    }
    postData.hydrogeology = {
      aquifer_name: well.aquifer_name || "",
      aquifer_material: well.aquifer_material || "",
      aquifer_type: getTermId(well.aquifer_type, "termaquifertype") || "",
      aquifer_thickness: well.aquifer_thickness || "",
      confinement: getTermId(well.confinement, "termconfinement") || "",
      pumping_test: {
        porosity: well.porosity || "",
        hydraulic_conductivity_value: well.hydraulic_conductivity || "",
        hydraulic_conductivity_unit: getUnitValue(well.hydraulic_conductivity, well.hydraulic_conductivity_unit, well.hydraulic_conductivity_unit_key),
        transmissivity_value: well.transmissivity || "",
        transmissivity_unit: getUnitValue(well.transmissivity, well.transmissivity_unit, well.transmissivity_unit_key),
        specific_storage_value: well.specific_storage || "",
        specific_storage_unit: getUnitValue(well.specific_storage, well.specific_storage_unit, well.specific_storage_unit_key),
        specific_yield: well.specific_yield || "",
        storativity_value: well.yield || "",
        storativity_unit: getUnitValue(well.yield, well.yield_unit, well.yield_unit_key),
        specific_capacity_value: well.specific_capacity || "",
        specific_capacity_unit: getUnitValue(well.specific_capacity, well.specific_capacity_unit, well.specific_capacity_unit_key),
        test_type: well.test_type || ""
      }
    }

    parseMeasurementData('level_measurements', 'level_measurement')
    parseMeasurementData('yield_measurements', 'yield_measurement')
    parseMeasurementData('quality_measurements', 'quality_measurement')
    return postData
  }

  /**
   * Update a single well
   */
  async putWell(well: Well): Promise<Types.GetWellResult> {
    // make the api call
    const terms = await loadTerms()
    const postData = this.parseWell(well, terms)
    const url = `/groundwater/api/well/minimized/${well.pk}/edit`
    const response: ApiResponse<any> = await this.apisauce.put(
      url,
      postData
    )

    // the typical ways to die when calling an api
    if (!response.ok) {
      const problem = getGeneralApiProblem(response)
      if (problem) return problem
    }

    // transform the data into the format we are expecting
    try {
      return { kind: "ok", well: new Well({}).convertFromMinimizedData(response.data) }
    } catch {
      return { kind: "bad-data" }
    }
  }

  /**
   * Post a single well
   */
  async postWell(well: Well): Promise<Types.GetWellResult> {
    // make the api call
    const terms = await loadTerms()
    const postData = this.parseWell(well, terms)
    const url = `/groundwater/api/well/minimized/create`
    const response: ApiResponse<any> = await this.apisauce.post(
      url,
      postData
    )

    // the typical ways to die when calling an api
    if (!response.ok) {
      const problem = getGeneralApiProblem(response)
      if (problem) return problem
    }

    // transform the data into the format we are expecting
    try {
      return { kind: "ok", well: new Well({}).convertFromMinimizedData(response.data) }
    } catch {
      return { kind: "bad-data" }
    }
  }
}
