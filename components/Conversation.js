import React, {Component, PropTypes} from 'react';

import {connect} from 'react-redux';

import {
  View,
  Text,
} from 'react-native';

import {ChatHistory} from './ChatHistory';
import {ChatInput} from './ChatInput';
import {ChatUsers} from './ChatUsers';
import {ChatUsersTyping} from './ChatUsersTyping';

import {conversationActions} from '../actions';

import {channel} from '../constants';

import {
  history,
  publishTypingState,
  publishMessage,
  subscribe,
} from '../services/pubnub';

import styles from '../styles';

class BareConversation extends Component {
  render() {
    const {
      currentUserId,
      history,
      users,
      typingUsers,
    } = this.props;
    const containerStyle = [

      styles.flx1,
      styles.flxCol,
      styles.selfStretch,
    ];

    return (
      <View style={containerStyle}>
        <ChatUsers users={users} />
        <ChatHistory history={history} fetchHistory={this.fetchHistory.bind(this)} />
        <ChatUsersTyping users={typingUsers} />
        <ChatInput
          currentUserId={currentUserId}
          setTypingState={typing => this.onTypingStateChanged(typing)}
          publishMessage={this.publishMessage.bind(this)} />
      </View>
    );
  }

  componentDidMount() {
    this.subscription = subscribe(
      p => this.onPresenceChange(p),
      m => this.onMessageReceived(m));

    this.fetchHistory();
  }

  componentWillUnmount() {
    if (this.subscription) {
      this.subscription.unsubscribe();
      this.subscription = null;
    }
  }

  onTypingStateChanged(typing) {
    if (typing) {
      this.props.startTyping(this.props.currentUserId);
    }
    else {
      this.props.stopTyping(this.props.currentUserId);
    }

    publishTypingState(this.props.currentUserId, typing);
  }

  onMessageReceived(message) {
    this.props.addMessage(message.message);
  }

  onPresenceChange(presenceData) {
    switch (presenceData.action) {
      case 'join':
        this.props.addUser(presenceData.uuid);
        break;
      case 'leave':
      case 'timeout':
        this.props.removeUser(presenceData.uuid);
        break;
      case 'state-change':
        if (presenceData.state) {
          if (presenceData.state.isTyping === true) {
            this.props.startTyping(presenceData.uuid);
          }
          else {
            this.props.stopTyping(presenceData.uuid);
          }
        }
        break;
      default:
        break;
    }
  }

  fetchHistory() {
    const {lastMessageTimestamp, addHistory} = this.props;

    history(lastMessageTimestamp).then(response => {
      // make sure we're not duplicating our existing history
      if (response.messages.length > 0 &&
          lastMessageTimestamp !== response.startTimeToken) {
        addHistory(response.messages, response.startTimeToken)
      }
    })
  }

  publishMessage(message) {
    publishMessage(channel, message);
  }
}

BareConversation.propTypes = {
  currentUserId: PropTypes.string,
  users: PropTypes.array,
  typingUsers: PropTypes.array,
  history: PropTypes.array,
  lastMessageTimestamp: PropTypes.number,
};

const mapStateToProps = state =>
  Object.assign({}, state.conversation.toJS(), {
    currentUserId: state.connection.get('currentUserId'),
  });

export const Conversation = connect(mapStateToProps, conversationActions)(BareConversation);
