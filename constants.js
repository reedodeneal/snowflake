// @flow
import * as d3 from 'd3'


export type Milestone = 0 | 1 | 2 | 3 | 4 | 5

export type MilestoneMap = {
  [trackId: string]: Milestone
}
export const milestones = [0, 1, 2, 3, 4, 5]

export const milestoneToPoints = (milestone: Milestone): number => {
  switch (milestone) {
    case 0: return 0
    case 1: return 1
    case 2: return 3
    case 3: return 6
    case 4: return 12
    case 5: return 20
    default: return 0
  }
}

export const pointsToLevels = {
  '0': '1.1',
  '5': '1.2',
  '11': '1.3',
  '17': '2.1',
  '23': '2.2',
  '29': '2.3',
  '36': '3.1',
  '43': '3.2',
  '50': '3.3',
  '58': '4.1',
  '66': '4.2',
  '74': '4.3',
  '90': '5.1',
  '110': '5.2',
  '135': '5.3',
}

export const maxLevel = 135

export type Track = {
  displayName: string,
  category: string, // TK categoryId type?
  description: string,
  milestones: {
    summary: string,
    signals: string[],
    examples: string[]
  }[]
}

export type TrackMap = {
  [trackId: string]: Track
}

export const categoryIds = (trackMap: TrackMap): Set<string> => {
  return Object.keys(trackMap).reduce((set, trackId) => {
    set.add(trackMap[trackId].category)
    return set
  }, new Set())
}

export const categoryPointsFromMilestoneMap = (trackMap: TrackMap, milestoneMap: MilestoneMap) => {
  let pointsByCategory = new Map()
  Object.keys(trackMap).forEach((trackId) => {
    const milestone = milestoneMap[trackId]
    const categoryId = trackMap[trackId].category
    let currentPoints = pointsByCategory.get(categoryId) || 0
    pointsByCategory.set(categoryId, currentPoints + milestoneToPoints(milestone))
  })
  return Array.from(categoryIds(trackMap).values()).map(categoryId => {
    const points = pointsByCategory.get(categoryId)
    return { categoryId, points: pointsByCategory.get(categoryId) || 0 }
  })
}

export const totalPointsFromMilestoneMap = (milestoneMap: MilestoneMap): number =>
  Object.keys(milestoneMap).map(trackId => milestoneToPoints(milestoneMap[trackId]))
    .reduce((sum, addend) => (sum + addend), 0)

export const categoryColorScale = (trackMap: TrackMap) => {
  return d3.scaleOrdinal()
    .domain(categoryIds(trackMap))
    .range(['#707372', '#009ca6', '#d0df00', '#ff8200'])
}

export const teams = ['Development', 'Design', 'Product', 'Quality Assurance']
