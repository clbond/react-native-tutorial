import {OrderedSet, fromJS} from 'immutable';

import {
  ADD_USER,
  ADD_HISTORY,
  REMOVE_USER,
  START_TYPING,
  STOP_TYPING,
} from '../actions';

export const initialState = fromJS({
  /// Users who are connected to the service (IDs)
  users: OrderedSet(),

  /// Users who are typing
  typingUsers: OrderedSet(),

  /// Visible message history
  history: OrderedSet(),

  lastMessageTimestamp: null,
});

export const conversationReducer = (state = initialState, action) => {
  const {userId} = (action.payload || {});

  switch (action.type) {
    case ADD_USER:
      return state.update('users', users => users.add(userId));

    case REMOVE_USER:
      return state.update('users', users => users.delete(userId));

    case START_TYPING:
      return state.update('typingUsers', typingUsers => typingUsers.add(userId));

    case STOP_TYPING:
      return state.update('typingUsers', typingUsers => typingUsers.delete(userId));

    case ADD_HISTORY:
      return state
        .update('history', (messages) => messages.unshift(...action.payload.messages))
        .set('lastMessageTimestamp', () => action.payload.timestamp);

    default:
      return state;
  }
};
