import pandas as pd
import re
import os
import tkinter as tk
from tkinter import filedialog, messagebox

def clean_vehicle_data(df):
    """
    Applies the model cleaning logic to a DataFrame.
    """
    # --- Step 1: Separate Codes from Names ---
    def separate_code_and_name(model_str):
        model_str = str(model_str).strip()
        model_code_regex = r'^([0-9A-Z]{2,5}-[A-Z0-9-]+)\b'
        match = re.search(model_code_regex, model_str)
        
        if match:
            code = match.group(1)
            name = model_str[len(code):].strip()
            return code, name
        else:
            return None, model_str

    df[['Model_Code', 'Clean_Name']] = df['Model'].apply(
        lambda x: pd.Series(separate_code_and_name(x))
    )

    # --- Step 2: Create Lookup Map and Fill Blanks ---
    map_df = df.dropna(subset=['Model_Code'])
    map_df = map_df[map_df['Clean_Name'] != '']
    
    # Create the lookup dictionary
    lookup_map = pd.Series(map_df.Clean_Name.values, index=map_df.Model_Code).drop_duplicates().to_dict()

    # Find rows that have a code but a blank name
    condition = (df['Clean_Name'] == '') & (df['Model_Code'].notnull())
    df.loc[condition, 'Clean_Name'] = df.loc[condition, 'Model_Code'].map(lookup_map)

    # --- Final Cleanup ---
    df.loc[df['Clean_Name'] == '', 'Clean_Name'] = 'Unknown/Code-Only'
    df['Clean_Name'] = df['Clean_Name'].fillna('Unknown')
    
    return df

def process_file():
    """
    Main function to ask for a file, process it, and save it.
    """
    # --- Part 1: Ask for the file path ---
    root = tk.Tk()
    root.withdraw()  # Hide the small empty tkinter window

    file_path = filedialog.askopenfilename(
        title="Select a vehicle data file",
        filetypes=[("Excel files", "*.xlsx"), ("CSV files", "*.csv"), ("All files", "*.*")]
    )

    if not file_path:
        # User cancelled the dialog
        messagebox.showinfo("Cancelled", "No file selected. The operation was cancelled.")
        return

    try:
        # --- Part 2: Read the file ---
        print(f"Loading file: {file_path}")
        
        # Check file extension and read accordingly
        if file_path.endswith('.csv'):
            df = pd.read_csv(file_path)
        elif file_path.endswith('.xlsx'):
            df = pd.read_excel(file_path)
        else:
            messagebox.showerror("Error", "Invalid file type. Please select a .csv or .xlsx file.")
            return

        # --- Part 3: Clean the data ---
        print("Cleaning data...")
        df_cleaned = clean_vehicle_data(df)
        print("Cleaning complete.")

        # --- Part 4: Save the new file ---
        
        # Get original file's directory and name
        original_dir = os.path.dirname(file_path)
        original_filename = os.path.basename(file_path)

        # Create the new folder name and path
        output_folder_name = "edited_files"
        output_folder_path = os.path.join(original_dir, output_folder_name)
        
        # Create the folder if it doesn't exist
        os.makedirs(output_folder_path, exist_ok=True)

        # Create the new file name
        output_filename = f"edited_{original_filename}"
        output_file_path = os.path.join(output_folder_path, output_filename)

        # Save the file (as a CSV for simplicity, or match original type)
        # We'll save as CSV
        if output_file_path.endswith('.xlsx'):
             # If original was Excel, make the new name .csv
             output_file_path = os.path.splitext(output_file_path)[0] + ".csv"

        df_cleaned.to_csv(output_file_path, index=False)
        
        print(f"Successfully saved cleaned file to: {output_file_path}")
        messagebox.showinfo(
            "Success!",
            f"File has been cleaned and saved as:\n\n{output_file_path}"
        )

    except Exception as e:
        print(f"An error occurred: {e}")
        messagebox.showerror("Error", f"An error occurred:\n\n{e}")


# --- Run the main function ---
if __name__ == "__main__":
    process_file()