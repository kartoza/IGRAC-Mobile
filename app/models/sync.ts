import { load, save } from "../utils/storage"

export const addToQueue = async (data: object) => {
  let queueData = await load("queue")
  if (!queueData) {
    queueData = [data]
  } else {
    queueData.push(data)
  }
  await save("queue", queueData)
}

export const removeFromQueue = async (data: object) => {
}

export const pushUpdates = async () => {
}

export const getTotalQueue = async () => {
  const queueData = await load("queue")
  if (!queueData) {
    return 0
  }
  return queueData.length
}
