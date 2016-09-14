import PubNub from 'pubnub';

import {configuration} from './configuration';

let connection;

export const connect = () => {
  if (connection) {
    return connection;
  }

  connection = new Promise((resolve, reject) => {
    const pubnub = new PubNub(Object.assign({}, configuration, {uuid: identifier()}));

    const initialHandler = {
      status: statusEvent => {
        switch (statusEvent.category) {
          case 'PNConnectedCategory':
          case 'PNNetworkUpCategory':
            resolve(pubnub);
            break;
          case 'PNDisconnectedCategory':
          case 'PNNetworkDownCategory':
            setTimeout(() => connect(), 1000); // reconnect in 1s
            break;
          default:
            return;
        }

        pubnub.removeListener(initialHandler);

        // reconnect handler
        pubnub.addListener({
          status: statusEvent => {
            switch (statusEvent.category) {
              case 'PNNetworkDownCategory':
                connect(); // reconnect
                break;
            }
          },
        });
      },
    };

    pubnub.addListener(initialHandler);

    handshake(pubnub).then(resolve).catch(reject);
  });

  return connection;
};

const handshake = pubnub => {
  return new Promise((resolve, reject) => {
    pubnub.time(status => {
      if (status.error) {
        reject(new Error(`PubNub service failed to respond to time request: ${status.error}`));
      }
      else {
        subscribeToChannel(pubnub);
      }
    });
  });
}

export const publish = msg =>
  connected.then(handle => {
    return new Promise(resolve => {
      handle.publish(msg,
        (status, response) => {
          resolve(response);
        });
    });
  });

const identifier = () => Math.random().toString(16).slice(2);

const subscribeToChannel = pubnub => {
  pubnub.subscribe({
    channels: ['ReactChat'],
    withPresence: true,
    message: function () {
      debugger;
    },
    presence: function () {
      debugger;
    },
  });
}