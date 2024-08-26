export const errorHandler = (err, req, res) => {
  const { message, details } = err.response.data;
  res.status(err.status || 500).send({
    message,
    details,
  });
};
