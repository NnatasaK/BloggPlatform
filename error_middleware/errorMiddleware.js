const errorMiddleware = (err, req, res, next) => {
    const statusCode = res.statusCode ? res.statusCode : 500;
    res.status(statusCode);

    // development process not clear, learn about it later
    res.json({ message: err.message, stack: process.env.NODE_ENV === "development" ? err.stack : null });
}

module.exports = errorMiddleware;