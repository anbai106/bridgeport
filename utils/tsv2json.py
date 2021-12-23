import pandas as pd
import glob
import os

os.chdir("/Users/tim/repos/bridgeport/data")
df = pd.read_csv("Significnat_after_correction_thres_5e-8.tsv", sep="\t")
df.sort_values(by=["P"], inplace=True)
df.to_json("GWAS.json", orient="records")
