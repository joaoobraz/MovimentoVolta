const DESTINATIONS = [
  "lg09030220@gmail.com",
  "joaobraz.ofc@gmail.com",
];

export default {
  async email(message) {
    await Promise.all(
      DESTINATIONS.map(destination => message.forward(destination)),
    );
  },
};
