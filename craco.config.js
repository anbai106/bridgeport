module.exports = {
    style: {
        postcssOptions: {
            plugins: [
                require('tailwindcss'),
                require('autoprefixer'),
            ],
        },
    },
    experiments: {
        topLevelAwait: true
    },
    watchOptions: { ignored: /node_modules/ }
}