import pandas as pd
import glob
import os

os.chdir("/home/hao/Project/bridgeport/data")
df = pd.read_csv("Significnat_after_correction_thres_5e-8.tsv", sep="\t")
df.to_json("GWAS.json", orient="records")
