const paginateResults = (results, perPage) => {
    const paginatedResults = {
        // double arrays for pagination
        'GWAS': [[]],
        'IWAS': [[]],
        'geneticCorrelation': [[]],
        'geneAnalysis': [[]],
        'heritabilityEstimate': [[]],
    };
    for (const k in results) {
        if (Object.hasOwnProperty.call(results, k)) {
            let page = 0;
            for (let i = 0; i < results[k].length; i++) {
                if (paginatedResults[k][page] === undefined) {
                    paginatedResults[k][page] = [];
                }
                const searchResult = results[k][i];
                paginatedResults[k][page].push(searchResult);
                if (paginatedResults[k][page].length === perPage) {
                    page += 1;
                }
            }
        }
    }
    return paginatedResults;
};
export default paginateResults;