// @flow
import React from 'react';

import { connect } from 'react-redux';
import moment from 'moment';
import { List, AutoSizer } from 'react-virtualized';
import classNames from 'classnames';

import Styles from '../assets/styles/app.css';

import { type Location, setSelectedLocation } from '~/reducer/dashboard';
import { type GlobalState } from '~/reducer/state';
import { createSelector } from 'reselect';

import { changeTabBus, type ChangeTabPayload, scrollToRowBus, type ScrollToRowPayload } from '~/globalBus';
import _ from 'lodash';

type LocationRow = {|
  uuid: string,
  device_id: string,
  coordinate: string,
  recorded_at: string,
  created_at: string,
  is_moving: string,
  accuracy: number,
  speed: number,
  odometer: number,
  activity: string,
  battery_level: string,
  battery_is_charging: boolean,
  event: string,
|};
type StateProps = {|
  locations: LocationRow[],
  selectedLocationId: string,
  isActiveTab: boolean,
|};

type DispatchProps = {|
  onRowSelect: (id: string) => any,
|};

type Props = {| ...StateProps, ...DispatchProps |};

const getRowData = (location: Location): LocationRow => {
  let event = location.event || '';
  switch (location.event) {
    case 'geofence':
      event = location.event + ': ' + location.geofence.action + ' ' + location.geofence.identifier;
      break;
  }
  return {
    uuid: location.uuid,
    device_id: location.device_id,
    coordinate: location.latitude.toFixed(6) + ', ' + location.longitude.toFixed(6),
    recorded_at: moment(new Date(location.recorded_at)).format('MM-DD HH:mm:ss:SSS'),
    created_at: moment(new Date(location.created_at)).format('MM-DD HH:mm:ss:SSS'),
    is_moving: location.is_moving ? 'true' : 'false',
    accuracy: location.accuracy,
    speed: location.speed,
    odometer: location.odometer,
    event: event,
    activity: `${location.activity_type} (${location.activity_confidence}%)`,
    battery_level: `${(location.battery_level * 100).toFixed(0)}%`,
    battery_is_charging: location.battery_is_charging,
  };
};

class ListView extends React.PureComponent {
  props: Props;
  list: any;
  postponedScrollToRowPayload: ?ScrollToRowPayload = null;

  componentWillMount () {
    scrollToRowBus.subscribe(this.scrollToRow);
    changeTabBus.subscribe(this.changeTab);
  }

  componentWillUnmount () {
    scrollToRowBus.unsubscribe(this.scrollToRow);
    changeTabBus.unsubscribe(this.changeTab);
  }

  changeTab = (payload: ChangeTabPayload) => {
    if (this.props.isActiveTab) {
      setTimeout(() => this.scrollToRowIfPostponed(), 1);
    }
  };

  scrollToRowIfPostponed () {
    if (this.postponedScrollToRowPayload) {
      this.scrollToRow(this.postponedScrollToRowPayload);
      this.postponedScrollToRowPayload = null;
    }
  }

  // scrolling to the specified location
  // if the tab is not active - postpone till tab becomes active
  scrollToRow = ({ locationId }: ScrollToRowPayload) => {
    if (!this.props.isActiveTab) {
      this.postponedScrollToRowPayload = { locationId };
      return;
    }
    if (this.list) {
      const index = _.findIndex(this.props.locations, { uuid: locationId });
      this.list.scrollToRow(index);
    }
  };

  rowRenderer = ({ index, isScrolling, isVisible, key, parent, style }: any) => {
    const item = this.props.locations[index];
    return (
      <div
        key={key}
        className={classNames(Styles.listRow, { [Styles.selectedRow]: item.uuid === this.props.selectedLocationId })}
        style={style}
        onClick={() => this.props.onRowSelect(item.uuid)}
      >
        <span style={{ width: 180 }}>
          <span>
            {item.uuid}
          </span>
        </span>
        <span style={{ width: 120 }}>
          <span>
            {item.recorded_at}
          </span>
        </span>
        <span style={{ width: 120 }}>
          <span>
            {item.created_at}
          </span>
        </span>
        <span style={{ width: 90 }}>
          <span>
            {item.coordinate}
          </span>
        </span>
        <span style={{ width: 80 }}>
          <span>
            {item.accuracy}
          </span>
        </span>
        <span style={{ width: 80 }}>
          <span>
            {item.speed}
          </span>
        </span>
        <span style={{ width: 80 }}>
          <span>
            {item.odometer}
          </span>
        </span>
        <span style={{ width: 180 }}>
          <span>
            <strong>
              {item.event}
            </strong>
          </span>
        </span>
        <span style={{ width: 80 }}>
          <span>
            {item.is_moving}
          </span>
        </span>
        <span style={{ width: 140 }}>
          <span>
            {item.activity}
          </span>
        </span>
        <span style={{ width: 80 }} className={item.battery_is_charging ? Styles.tableCellGreen : Styles.tableCellRed}>
          <span>
            {item.battery_level}
          </span>
        </span>
      </div>
    );
  };
  render () {
    setTimeout(() => this.list && this.list.forceUpdateGrid(), 1);
    return (
      <div className={Styles.list} style={{ width: '100%', height: '100%' }}>
        <div className={Styles.listHeaderRow}>
          <span style={{ width: 180 }}>UUID</span>
          <span style={{ width: 120 }}>RECORDED AT</span>
          <span style={{ width: 120 }}>CREATED AT</span>
          <span style={{ width: 90 }}>COORDINATE</span>
          <span style={{ width: 80 }}>ACCURACY</span>
          <span style={{ width: 80 }}>SPEED</span>
          <span style={{ width: 80 }}>ODOMETER</span>
          <span style={{ width: 180 }}>EVENT</span>
          <span style={{ width: 80 }}>IS MOVING</span>
          <span style={{ width: 140 }}>ACTIVITY</span>
          <span style={{ width: 80 }}>BATTERY</span>
        </div>
        <div style={{ width: '100%', height: 'calc(100% - 55px)' }}>
          <AutoSizer>
            {({ width, height }: { width: number, height: number }) =>
              <List
                scrollToAlignment='start'
                style={{ outline: 0 }}
                ref={(list: React$Element<any>) => (this.list = list)}
                width={1260}
                height={height}
                rowCount={this.props.locations.length}
                rowHeight={48}
                rowRenderer={this.rowRenderer}
              />}
          </AutoSizer>
        </div>
      </div>
    );
  }
}

type LocationArgs = {
  isWatching: boolean,
  currentLocation: ?Location,
  locations: Location[],
};
const getLocationsSource = function ({ locations, currentLocation, isWatching }: LocationArgs) {
  if (isWatching) {
    return currentLocation ? [currentLocation] : [];
  } else {
    return locations;
  }
};

const getLocations = function ({ locations, currentLocation, isWatching }: LocationArgs) {
  const source = getLocationsSource({ locations, currentLocation, isWatching });
  return source.map(getRowData);
};

const getLocationsSelector = createSelector(
  [
    (state: GlobalState) => ({
      locations: state.dashboard.locations,
      currentLocation: state.dashboard.currentLocation,
      isWatching: state.dashboard.isWatching,
    }),
  ],
  ({ locations, currentLocation, isWatching }: LocationArgs) => getLocations({ locations, currentLocation, isWatching })
);

const mapStateToProps = function (state: GlobalState): StateProps {
  return {
    locations: getLocationsSelector(state),
    selectedLocationId: state.dashboard.selectedLocationId,
    isActiveTab: state.dashboard.activeTab === 'list',
  };
};

const mapDispatchToProps: DispatchProps = {
  onRowSelect: setSelectedLocation,
};

export default connect(mapStateToProps, mapDispatchToProps)(ListView);
