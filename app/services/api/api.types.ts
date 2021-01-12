import { GeneralApiProblem } from "./api-problem"
import WellInterface from "../../models/well/well"

export interface User {
  id: number
  name: string
}

export type GetUsersResult = { kind: "ok"; users: User[] } | GeneralApiProblem
export type GetUserResult = { kind: "ok"; user: User } | GeneralApiProblem
export type GetWellsResult = { kind: "ok"; wells: WellInterface[]; terms: any[] } | GeneralApiProblem
export type GetWellResult = { kind: "ok"; well: WellInterface; terms?: any[] } | GeneralApiProblem
