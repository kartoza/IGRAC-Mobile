import { GeneralApiProblem } from "./api-problem"
import Well from "../../models/well/well"

export interface User {
  id: number
  name: string
}

export type GetUsersResult = { kind: "ok"; users: User[] } | GeneralApiProblem
export type GetUserResult = { kind: "ok"; user: User } | GeneralApiProblem
export type GetWellsResult = { kind: "ok"; wells: Well[]; terms: any[] } | GeneralApiProblem
export type GetWellResult = { kind: "ok"; well: Well; terms?: any[] } | GeneralApiProblem
