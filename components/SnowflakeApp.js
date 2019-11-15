// @flow

import TrackSelector from '../components/TrackSelector'
import NightingaleChart from '../components/NightingaleChart'
import KeyboardListener from '../components/KeyboardListener'
import Track from '../components/Track'
import Wordmark from '../components/Wordmark'
import LevelThermometer from '../components/LevelThermometer'
import { milestones, milestoneToPoints, categoryColorScale } from '../constants'
import PointSummaries from '../components/PointSummaries'
import type { Milestone, MilestoneMap, TrackMap } from '../constants'
import React from 'react'
import TeamSelector from '../components/TeamSelector'

const developmentTracks = require('../tracks/development.json')
const designTracks = require('../tracks/design.json')
const productTracks = require('../tracks/product.json')
const qaTracks = require('../tracks/qa.json')

type SnowflakeAppState = {
  milestoneByTrack: MilestoneMap,
  name: string,
  team: string,
  activeTracks: TrackMap,
  focusedTrackId: string,
  categoryColorScale: Function
}

const tracksByTeam = (team: string): TrackMap => {
  switch (team) {
    case 'Design':
      return designTracks
    case 'Product':
      return productTracks
    case 'Quality Assurance':
      return qaTracks
    default:
      return developmentTracks
  }
}

const dataToState = (data: JSON): ?SnowflakeAppState => {
  if (!data) return null
  const hashValues = JSON.stringify(data.tracksByTeam).replace(/["]+/g, '').split(',')
  const result = defaultState()
  const tracks = tracksByTeam(data.team)
  result.name = data.username
  result.team = data.team
  result.activeTracks = tracks
  result.milestoneByTrack = milestoneByTrack(tracks)
  result.focusedTrackId = Object.keys(tracks)[0]
  result.categoryColorScale = categoryColorScale(tracks)
  const trackIds = Object.keys(result.activeTracks)
  trackIds.forEach((trackId, i) => {
    result.milestoneByTrack[trackId] = coerceMilestone(Number(hashValues[i]))
  })
  return result
  /*
  const hashValues = hash.split('#')[1].split(',')
  if (!hashValues) return null
  if (hashValues[14]) result.name = decodeURI(hashValues[14])
  if (hashValues[15]) {
    result.team = data.team
    const tracks = tracksByTeam(result.team)
    result.activeTracks = tracks
    result.milestoneByTrack = milestoneByTrack(tracks)
    result.focusedTrackId = Object.keys(tracks)[0]
    result.categoryColorScale = categoryColorScale(tracks)
  }
  const trackIds = Object.keys(result.activeTracks)
  trackIds.forEach((trackId, i) => {
    result.milestoneByTrack[trackId] = coerceMilestone(Number(hashValues[i]))
  })
  return result
  */
}

const coerceMilestone = (value: number): Milestone => {
  // HACK I know this is goofy but i'm dealing with flow typing
  switch(value) {
    case 0: return 0
    case 1: return 1
    case 2: return 2
    case 3: return 3
    case 4: return 4
    case 5: return 5
    default: return 0
  }
}

const milestoneByTrack = (trackMap: TrackMap): MilestoneMap => {
  return Object.keys(trackMap).reduce((milestoneMap, trackId) => {
    milestoneMap[trackId] = 0
    return milestoneMap
  }, {})
}

const emptyState = (): SnowflakeAppState => {
  return {
    name: '',
    team: 'Development',
    milestoneByTrack: milestoneByTrack(developmentTracks),
    activeTracks: developmentTracks,
    focusedTrackId: 'MOBILE',
    categoryColorScale: categoryColorScale(developmentTracks)
  }
}

const defaultState = (): SnowflakeAppState => {
  return {
    name: '',
    team: 'Development',
    milestoneByTrack: milestoneByTrack(developmentTracks),
    activeTracks: developmentTracks,
    focusedTrackId: 'MOBILE',
    categoryColorScale: categoryColorScale(developmentTracks)
  }
}

const stateToValuesHash = (state: SnowflakeAppState) => {
  if (!state || !state.milestoneByTrack) return null
  const trackIds = Object.keys(state.activeTracks)
  const values = trackIds.map(trackId => state.milestoneByTrack[trackId])
  return values.join(',')
}

type Props = {}

class SnowflakeApp extends React.Component<Props, SnowflakeAppState> {
  constructor(props: Props) {
    super(props)
    this.state = emptyState()
    this.handleSubmit = this.handleSubmit.bind(this);
  }

  componentDidMount() {
    var xhr = new XMLHttpRequest()
    xhr.open('GET', 'http://localhost:3001/get?username=john.patterson')
    xhr.send()
    xhr.addEventListener('load', () => {
    const json = JSON.parse(xhr.responseText.replace(/["]+/g, '').replace(/['']+/g, '"'))
    this.setState(dataToState(json))
    })
  }

  handleSubmit(event) {
    event.preventDefault();
    const data = {
      "username": this.state.name,
      "name": this.state.name,
      "tracksByTeam": stateToValuesHash(this.state),
      "team": this.state.team
    }
    fetch('http://localhost:3001/update', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  render() {
    return (
      <main>
        <style jsx global>{`
          body {
            font-family: Helvetica;
          }
          main {
            width: 960px;
            margin: 0 auto;
          }
          .name-field {
            border: none;
            display: block;
            border-bottom: 2px solid #fff;
            font-size: 30px;
            line-height: 40px;
            font-weight: bold;
            width: 380px;
            margin-bottom: 10px;
          }
          a {
            color: #888;
            text-decoration: none;
          }

        `}</style>
        <div style={{margin: '19px auto 0', width: 450}}>
          <a href="https://sagesure.com/" target="_blank">
            <Wordmark />
          </a>
        </div>
        <div>
          <form onSubmit={this.handleSubmit}>
            <button>Save Profile</button>
          </form>
        </div>
        <div style={{display: 'flex'}}>
          <div style={{flex: 1}}>
            <div className="name-field">
              {this.state.name}
            </div>
            <form>
              <TeamSelector
                  milestoneByTrack={this.state.milestoneByTrack}
                  currentTeam={this.state.team}
                  handleTeamChangeFn={(team) => this.handleTeamChange(team)} />
            </form>
            <PointSummaries milestoneByTrack={this.state.milestoneByTrack} />
            <LevelThermometer
                milestoneByTrack={this.state.milestoneByTrack}
                activeTracks={this.state.activeTracks}
                categoryColorScale={this.state.categoryColorScale} />
          </div>
          
          <div style={{flex: 0}}>
            <NightingaleChart
                milestoneByTrack={this.state.milestoneByTrack}
                activeTracks={this.state.activeTracks}
                focusedTrackId={this.state.focusedTrackId}
                categoryColorScale={this.state.categoryColorScale}
                handleTrackMilestoneChangeFn={(track, milestone) => this.handleTrackMilestoneChange(track, milestone)} />
          </div>
        </div>
        <TrackSelector
            milestoneByTrack={this.state.milestoneByTrack}
            activeTracks={this.state.activeTracks}
            focusedTrackId={this.state.focusedTrackId}
            categoryColorScale={this.state.categoryColorScale}
            setFocusedTrackIdFn={this.setFocusedTrackId.bind(this)} />
        <KeyboardListener
            selectNextTrackFn={this.shiftFocusedTrack.bind(this, 1)}
            selectPrevTrackFn={this.shiftFocusedTrack.bind(this, -1)}
            increaseFocusedMilestoneFn={this.shiftFocusedTrackMilestoneByDelta.bind(this, 1)}
            decreaseFocusedMilestoneFn={this.shiftFocusedTrackMilestoneByDelta.bind(this, -1)} />
        <Track
            milestoneByTrack={this.state.milestoneByTrack}
            track={this.state.activeTracks[this.state.focusedTrackId]}
            trackId={this.state.focusedTrackId}
            categoryColorScale={this.state.categoryColorScale}
            handleTrackMilestoneChangeFn={(track, milestone) => this.handleTrackMilestoneChange(track, milestone)} />
        <div style={{display: 'flex', paddingBottom: '20px'}}>
          <div style={{flex: 1}}>
            <a href="https://sagesure.com/careers">Join</a> the SageSure Team.
            Based on <a href="https://github.com/Medium/snowflake" target="_blank">Snowflake</a> by <a href="https://medium.engineering" target="_blank">Medium Eng</a>.
          </div>
        </div>
      </main>
    )
  }

  handleTrackMilestoneChange(trackId: string, milestone: Milestone) {
    const milestoneByTrack = this.state.milestoneByTrack
    milestoneByTrack[trackId] = milestone
    this.setState({ milestoneByTrack, focusedTrackId: trackId })
  }

  shiftFocusedTrack(delta: number) {
    const trackIds = Object.keys(this.state.activeTracks)
    let index = trackIds.indexOf(this.state.focusedTrackId)
    index = (index + delta + trackIds.length) % trackIds.length
    const focusedTrackId = trackIds[index]
    this.setState({ focusedTrackId })
  }

  setFocusedTrackId(trackId: string) {
    const trackIds = Object.keys(this.state.activeTracks)
    let index = trackIds.indexOf(trackId)
    const focusedTrackId = trackIds[index]
    this.setState({ focusedTrackId })
  }

  shiftFocusedTrackMilestoneByDelta(delta: number) {
    let prevMilestone = this.state.milestoneByTrack[this.state.focusedTrackId]
    let milestone = prevMilestone + delta
    if (milestone < 0) milestone = 0
    if (milestone > 5) milestone = 5
    this.handleTrackMilestoneChange(this.state.focusedTrackId, coerceMilestone(milestone))
  }

  handleTeamChange(team: string) {
    let tracks = tracksByTeam(team)
    this.setState({
      team,
      milestoneByTrack: milestoneByTrack(tracks),
      activeTracks: tracks,
      focusedTrackId: Object.keys(tracks)[0],
      categoryColorScale: categoryColorScale(tracks)
    })
  }
}

export default SnowflakeApp
