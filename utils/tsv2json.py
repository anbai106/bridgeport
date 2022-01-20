import pandas as pd
import os
import json

# can't use pd.read_csv / to_json because it doesn't support arbitrary floating point precision
def read_csv(csv_file):
    with open(csv_file, 'r') as f:
        lines = f.readlines()
        header = lines[0].strip().split('\t')
        data = []
        for line in lines[1:]:
            line = line.strip().split('\t')
            row = {}
            for i, col in enumerate(line):
                row[header[i]] = col
            data.append(row)
    return data

def write_json(json_file, data):
    with open(json_file, 'w') as f:
        f.write('[\n')
        i = len(data)
        for row in data:
            i -= 1
            json_row = []
            j = len(row)
            for key, value in row.items():
                j -= 1
                quoted_value = value if is_float(value) else '"' + value + '"'
                json_row.append('"{}": {}{}'.format(key, quoted_value, ',' if j > 0 else ""))
            last_comma = '' if i == 0 else ','
            f.write('{'+' '.join(json_row) + '}'+last_comma+'\n')
        f.write(']\n')

def is_float(element):
    try:
        float(element)
        return True
    except ValueError:
        return False

os.chdir("/Users/tim/repos/bridgeport/data")
df = read_csv("Significnat_after_correction_thres_5e-8.tsv")
write_json("GWAS.json", df)

df = read_csv("Gene_analysis/bridgeport_significant_gene.tsv")
write_json("gene_analysis.json", df)

df = read_csv("Genetic_correlation/bridgeport_genetic_correlation.tsv")
write_json("genetic_correlation.json", df)

df = read_csv("Heritability_estimate/bridgeport_heritability_estimate.tsv")
write_json("heritability_estimate.json", df)

df = read_csv("IWAS/bridgeport_iwas.tsv")
write_json("IWAS.json", df)
