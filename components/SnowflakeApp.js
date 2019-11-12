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
import LoadingOverlay from 'react-loading-overlay'

// workaround until SSR support for react-keycloak is pushed
const Keycloak = typeof window !== 'undefined' ? require('keycloak-js') : null

const developmentTracks = require('../tracks/development.json')
const designTracks = require('../tracks/design.json')
const productTracks = require('../tracks/product.json')
const qaTracks = require('../tracks/qa.json')

type SnowflakeAppState = {
  userName: string,
  preferredName: string,
  milestoneByTrack: MilestoneMap,
  team: string,
  activeTracks: TrackMap,
  focusedTrackId: string,
  categoryColorScale: Function,
  loading: bool
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

const dataToState = (data: string): ?SnowflakeAppState => {
  if (!data) return null
  const json = JSON.parse(data)
  const hashValues = JSON.stringify(json.tracksByTeam).replace(/["]+/g, '').split(',')
  const result = defaultState()
  const tracks = tracksByTeam(json.team)
  result.userName = json.username
  result.preferredName = json.name
  result.team = json.team
  result.activeTracks = tracks
  result.milestoneByTrack = milestoneByTrack(tracks)
  result.focusedTrackId = Object.keys(tracks)[0]
  result.categoryColorScale = categoryColorScale(tracks)
  const trackIds = Object.keys(result.activeTracks)
  trackIds.forEach((trackId, i) => {
    result.milestoneByTrack[trackId] = coerceMilestone(Number(hashValues[i]))
  })
  return result
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
    userName: '',
    preferredName: '',
    team: 'Development',
    milestoneByTrack: milestoneByTrack(developmentTracks),
    activeTracks: developmentTracks,
    focusedTrackId: 'MOBILE',
    categoryColorScale: categoryColorScale(developmentTracks),
    loading: true
  }
}

const defaultState = (): SnowflakeAppState => {
  return {
    userName: '',
    preferredName: '',
    team: 'Development',
    milestoneByTrack: milestoneByTrack(developmentTracks),
    activeTracks: developmentTracks,
    focusedTrackId: 'MOBILE',
    categoryColorScale: categoryColorScale(developmentTracks),
    loading: true
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
  }

  componentDidMount() {
    let initOptions = {
        url: process.env.REACT_APP_KEYCLOAK_AUTH_URL,
        realm: process.env.REACT_APP_KEYCLOAK_REALM,
        clientId: process.env.REACT_APP_KEYCLOAK_CLIENT_ID,
        onLoad: 'login-required'
    }

    if(Keycloak) {
      const keycloak = Keycloak(initOptions); 
      keycloak.init({ onLoad: initOptions.onLoad }).success((auth) => {

          if (!auth) {
              window.location.reload();
          }

          localStorage.setItem("token",keycloak.token)
          localStorage.setItem("refreshToken",keycloak.refreshToken)
          let loggedInUsername = keycloak.tokenParsed.preferred_username
          let loggedInUserPreferredName = keycloak.tokenParsed.name

          setTimeout(() => {
              keycloak.updateToken(70).success((refreshed) => {
                  if (refreshed) {
                      console.debug('Token refreshed' + refreshed);
                  } else {
                      console.warn('Token not refreshed, valid for '
                          + Math.round(keycloak.tokenParsed.exp + keycloak.timeSkew - new Date().getTime() / 1000) + ' seconds');
                  }
              }).error(() => {
                  console.error('Failed to refresh token');
              });
          }, 60000)

          var xhr = new XMLHttpRequest()
          xhr.open('GET', process.env.REACT_APP_BACKEND_URL + '/get?username=' + loggedInUsername)
          xhr.timeout = 2000
          xhr.setRequestHeader('Authorization','Bearer ' + keycloak.token)
          xhr.ontimeout = function () {
              alert("Request for user data timed out.");
          };
          xhr.onerror = function () {
              alert("Error encountered while making request for user data.");
          };
          xhr.send()
          xhr.addEventListener('load', () => {
            if(xhr.status == 200) {
              const d = xhr.responseText.replace(/["]+/g, '').replace(/['']+/g, '"')
              this.setState(dataToState(d))
              this.setState({loading: false})
            } else if(xhr.status == 404) {
              this.setState({preferredName:loggedInUserPreferredName})
              this.setState({userName:loggedInUsername})
              this.setState({loading: false})
            } else {
              alert("Error while trying to load user data from datastore. Unauthorized: " + xhr.status)
            }
          })

      }).error(() => {
          alert("Authentication failed while trying to load user data from datastore.");
      }).onTokenExpired = () => {
        keycloak.updateToken(30).success(() => {
            localStorage.setItem("token",keycloak.token)
        }).error(() => {
            alert("Error encountered refreshing auth token.")
        });
      };
    }
  }

  handleSubmit() {
    const token = localStorage.getItem("token") || ""
    const data = {
      "username": this.state.userName,
      "name": this.state.preferredName,
      "tracksByTeam": stateToValuesHash(this.state),
      "team": this.state.team
    }
    this.setState({ loading: true }, () => {
      setTimeout(() => {
        fetch(process.env.REACT_APP_BACKEND_URL + '/post', {
          method: 'POST',
          body: JSON.stringify(data),
          headers: {
            'Authorization': 'Bearer ' + token
          }
        }).then(response => {
            if(!response.status) {
              throw Error(response.status.toString())
            } else {
              this.setState({loading:false})
            }
          } ).catch(error => 
              alert("Failed to fetch user data: " + error))
              this.setState({loading:false})
      }, 500); // 500ms delay to briefly load react-loading-spinner onClick()
    });

  }

  handleLogout() {
    this.setState({loading: true}, () => {
      const token = localStorage.getItem("refreshToken") || ""
      fetch(process.env.REACT_APP_KEYCLOAK_LOGOUT_URL, {
        method: 'POST',
        mode: 'no-cors',
        headers: new Headers({
                   'Content-Type': 'application/x-www-form-urlencoded',
                   'Authorization': 'Bearer ' + token
          }),
        body: "client_id=snowflake&refresh_token=" + token
      }).then(
      function(response) {
      window.location.reload();
      })
    });
  }

  render() {
    const { loading } = this.state;
    return (
    
      <LoadingOverlay
        active={loading}
        spinner
        text='loading...'
        styles={{
          overlay: (base) => ({
            ...base,
            background: 'rgba(0, 0, 0, 1)'
          })
        }}
      >
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
              font-size: 30px;
              line-height: 40px;
              fontWeight: bold;
              padding-left: 12px;
            }
            .action-buttons {
              border: none;
            }
            a {
              color: #888;
              text-decoration: none;
            }

          `}</style>
          <link rel="stylesheet" href="https://stackpath.bootstrapcdn.com/bootstrap/4.4.1/css/bootstrap.min.css" integrity="sha384-Vkoo8x4CGsO3+Hhxv8T/Q5PaXtkKtu6ug5TOeNV6gBiFeWPGFN9MuhOf23Q9Ifjh" crossOrigin="anonymous"/>
          {loading ? <LoadingOverlay />:<div/>}
          <div style={{margin: '19px auto 0', width: 450}}>
            <a href="https://sagesure.com/" target="_blank">
              <Wordmark />
            </a>
          </div>
          <div style={{display: 'flex'}}>
            <div style={{flex: 1}}>
              
              <header
              style={{'width':'525px','marginBottom':'20px','marginTop':'20px','padding':'10px'}}>
                <div className="name-field">
                  {this.state.preferredName}
                </div>
                
                <div 
                  className="team-selector">
                    <div style={{'marginLeft':'12px','paddingTop':'3px'}}><b>Team: </b>
                      {this.state.team}
                    </div>
                </div>
                
                <div className="action-buttons">
                  <button
                    type="button"
                    className="btn btn-link"
                    onClick={() => {
                      this.handleSubmit()
                      }}
                    >
                    Save Profile
                    </button>
                    <button
                      type="button"
                      className="btn btn-link"
                      onClick={() => {
                        this.handleLogout()
                        }}
                    >
                    Logout
                  </button>
                </div>
              <PointSummaries milestoneByTrack={this.state.milestoneByTrack} />
              </header>
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
      </LoadingOverlay>
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
