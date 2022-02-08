const fancyPlaceholder = searchBy => {
    switch (searchBy) {
        case 'IDP':
            return 'Type Cx_y to search for a phenotype';
        case 'SNP':
            return 'Search for a SNP e.g. rs123456789';
        case 'IWAS':
            return 'Search for a clinical trait e.g. AD';
        case 'geneAnalysis':
            return 'Search for a gene symbol e.g. RUNX2';
        default:
            return "Search for a variant, gene, or phenotype";
    }
}
export default fancyPlaceholder;