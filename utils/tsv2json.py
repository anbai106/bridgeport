import pandas as pd
import os
import json

# can't use pd.read_csv / to_json because it doesn't support arbitrary floating point precision
def read_csv(csv_file, full_names = None):
    with open(csv_file, 'r') as f:
        lines = f.readlines()
        header = lines[0].strip().split('\t')
        data = []
        for line in lines[1:]:
            line = line.strip().split('\t')
            row = {}
            for i, col in enumerate(line):
                if col in ['ADNI_EF', 'ADNI_MEM', 'ADNI_LAN', 'ADNI_VS']:
                    row = "SKIP_THIS"
                    break
                row[header[i]] = full_names[col] if header[i] == 'trait' and full_names  is not None and col in full_names else col
            if row != "SKIP_THIS":
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

def read_kv_pairs(kv_file):
    with open(kv_file, 'r') as f:
        lines = f.readlines()
        # skip first line
        lines = lines[1:]
        data = {}
        for line in lines:
            line = line.split(':')
            data[line[0].strip()] = line[1].strip()
    return data

os.chdir("/Users/tim/repos/bridgeport/data")
df = read_csv("sourcedata/GWAS_SNP_significnat_after_correction_thres_5e-8.tsv")
write_json("json/GWAS.json", df)

df = read_csv("sourcedata/Gene_analysis/bridgeport_significant_gene.tsv")
write_json("json/gene_analysis.json", df)

# this file corresponds to genetic correlation
kv = read_kv_pairs("sourcedata/PWAS/clinical_phenotype_2_display_on_bridgeport.txt")
df = read_csv("sourcedata/Genetic_correlation/bridgeport_genetic_correlation.tsv", full_names=kv)
write_json("json/genetic_correlation.json", df)

df = read_csv("sourcedata/Heritability_estimate/bridgeport_heritability_estimate.tsv")
write_json("json/heritability_estimate.json", df)

# this file corresponds to IWAS
kv = read_kv_pairs("sourcedata/PWAS/clinical_phenotype_to_dispaly_on_bridgeport.txt")
df = read_csv("sourcedata/IWAS/bridgeport_iwas.tsv", full_names=kv)
write_json("json/IWAS.json", df)

df = read_csv("sourcedata/MUSE/MUSE_2_MINA_overlap_index.tsv")
write_json("json/MUSE.json", df)
