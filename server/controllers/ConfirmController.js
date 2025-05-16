exports.confirmSubscription = (req, res) => {
  const { token } = req.params;
  res.status(200).json({ message: `Subscription confirmed for token ${token}` });
};