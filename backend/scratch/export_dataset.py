import os
import sys
import pandas as pd
import numpy as np

# Add the backend directory to sys.path to allow imports from app.services
backend_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if backend_dir not in sys.path:
    sys.path.append(backend_dir)

try:
    from app.services.ml_predictor import generate_student_dataset, FEATURE_NAMES
except ImportError as e:
    print(f"Error importing ml_predictor: {e}")
    sys.exit(1)

def export_to_csv(filename="mindguard_burnout_dataset.csv"):
    print("Starting dataset generation for export...")
    
    # Generate 2500 samples as per the internal logic
    X, y = generate_student_dataset(n=2500)
    
    # Create DataFrame
    df = pd.DataFrame(X, columns=FEATURE_NAMES)
    
    # Map target labels
    label_map = {0: "Low", 1: "Moderate", 2: "High"}
    df['risk_level_label'] = [label_map[i] for i in y]
    df['risk_score_target'] = y
    
    # Save to CSV
    output_path = os.path.join(backend_dir, filename)
    df.to_csv(output_path, index=False)
    
    print(f"Successfully exported {len(df)} samples to: {output_path}")
    print("\nFeature List Included:")
    for i, name in enumerate(FEATURE_NAMES, 1):
        print(f"  {i}. {name}")

if __name__ == "__main__":
    export_to_csv()
