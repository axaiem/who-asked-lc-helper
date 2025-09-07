import os
import json
import pandas as pd
from pathlib import Path

# Relative path to the local clone inside your repo
LOCAL_REPO_PATH = Path(__file__).parent.parent / "leetcode-company-wise-problems"

# Output JSON file
OUTPUT_FILE = Path(__file__).parent.parent / "data/problems.json"

# Map CSV file names to friendly last_asked labels
FILE_NAME_TO_LAST_ASKED = {
    "1. Thirty Days.csv": "This Month",
    "2. Three Months.csv": "< 3 Months",
    "3. Six Months.csv": "< 6 Months",
    "4. More Than Six Months.csv": "> 6 Months",
    "5. All.csv": "All Time"
}

def get_priority(file_name):
    """Lower serial number = more recent"""
    try:
        return int(file_name.split(".")[0])
    except:
        return 99  # unknown files get lowest priority

def build_dataset():
    problems = {}
    base_dir = LOCAL_REPO_PATH.resolve()
    print("Scanning folder:", base_dir)

    # Recursively find all CSVs
    csv_files = list(base_dir.rglob("*.csv"))
    if not csv_files:
        print("⚠️ No CSV files found!")
        return

    for csv_file in csv_files:
        # Company = first folder under repo root
        rel_to_repo = csv_file.relative_to(base_dir)
        company_name = rel_to_repo.parts[0]

        # Determine last_asked from CSV file name
        file_name = csv_file.name
        last_asked_from_file = FILE_NAME_TO_LAST_ASKED.get(file_name, None)
        if not last_asked_from_file:
            continue  # skip unknown CSVs

        try:
            df = pd.read_csv(csv_file)
        except Exception as e:
            print(f"⚠️ Skipping {csv_file}, error: {e}")
            continue

        # Normalize and map columns
        df = df.rename(columns=lambda x: x.strip().lower())
        df = df.rename(columns={
            "title": "problem",
            "topics": "tags",
            "link": "link",
            "frequency": "frequency"
        })

        required_cols = {"problem", "frequency", "link"}
        if not required_cols.issubset(df.columns):
            print(f"⚠️ Skipping {csv_file}, missing required columns")
            continue

        # Compute max frequency for relative_frequency
        max_freq = df["frequency"].max() if not df["frequency"].isna().all() else 0

        for _, row in df.iterrows():
            problem = row["problem"].strip()
            tags = [t.strip() for t in str(row.get("tags", "")).split(",") if t.strip()]
            link = row.get("link", None)

            # Handle missing frequency
            frequency = None if pd.isna(row["frequency"]) else int(row["frequency"])
            relative_frequency = round(frequency / max_freq, 2) if frequency is not None and max_freq > 0 else None

            # Handle last_asked: pick the most recent if multiple CSVs
            existing_last_asked = problems.get(problem, {}).get("companies", {}).get(company_name, {}).get("last_asked", None)
            if existing_last_asked:
                # Compare priority, keep the more recent one
                last_asked_to_store = last_asked_from_file if get_priority(file_name) < get_priority(existing_last_asked) else existing_last_asked
            else:
                last_asked_to_store = last_asked_from_file

            if problem not in problems:
                problems[problem] = {
                    "companies": {},
                    "overall": {
                        "tags": tags,
                        "link": link,
                        "total_frequency": 0,
                        "max_relative_frequency": 0,
                        "companies_count": 0,
                        "most_recent": None
                    }
                }

            # Store/update company-specific data
            problems[problem]["companies"][company_name] = {
                "frequency": frequency,
                "relative_frequency": relative_frequency,
                "last_asked": last_asked_to_store
            }

            # Update overall stats
            overall = problems[problem]["overall"]
            overall["total_frequency"] += frequency if frequency is not None else 0
            overall["companies_count"] = len(problems[problem]["companies"])
            overall["max_relative_frequency"] = max(overall["max_relative_frequency"], relative_frequency or 0)
            
            # Update most_recent overall
            if last_asked_to_store:
                if not overall["most_recent"] or get_priority(file_name) < get_priority(overall["most_recent"]):
                    overall["most_recent"] = last_asked_to_store

    # Save final dataset
    os.makedirs(OUTPUT_FILE.parent, exist_ok=True)
    with open(OUTPUT_FILE, "w") as f:
        json.dump(problems, f, indent=2)

    print(f"✅ Dataset written to {OUTPUT_FILE}")


if __name__ == "__main__":
    build_dataset()
