import pandas as pd
import glob
import os

os.chdir("/Users/tim/repos/bridgeport/data")
df = pd.read_csv("Significnat_after_correction_thres_5e-8.tsv", sep="\t")
df = df[df.P > 0]
df.sort_values(by=["P"], inplace=True)
df.to_json("GWAS.json", orient="records")

df = pd.read_csv("Gene_analysis/bridgeport_significant_gene.tsv", sep="\t")
df.sort_values(by=["P"], inplace=True)
df.to_json("gene_analysis.json", orient="records")

df = pd.read_csv("Genetic_correlation/bridgeport_genetic_correlation.tsv", sep="\t")
df.sort_values(by=["P"], inplace=True)
df.to_json("genetic_correlation.json", orient="records")

df = pd.read_csv("Heritability_estimate/bridgeport_heritability_estimate.tsv", sep="\t")
df.sort_values(by=["Pvalue"], inplace=True)
df.to_json("heritability_estimate.json", orient="records")

df = pd.read_csv("IWAS/bridgeport_iwas.tsv", sep="\t")
df.sort_values(by=["Pvalue"], inplace=True)
df.to_json("IWAS.json", orient="records")
