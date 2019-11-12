// @flow

import React from 'react'
import { teams } from '../constants'
import type { MilestoneMap } from '../constants'

type Props = {
  currentTeam: string,
  handleTeamChangeFn: (string) => void
}

class TeamSelector extends React.Component<Props> {
  render() {
    return <select value={this.props.currentTeam} onChange={e => this.props.handleTeamChangeFn(e.target.value)}>
      <style jsx>{`
        select {
          line-height: 20px;
          margin-top: 5px;
          min-width: 150px;
          margin-left: 12px;
        }
      `}</style>
      {teams.map(team => (
        <option key={team}>
          {team}
        </option>
      ))}
    </select>
  }
}

export default TeamSelector
