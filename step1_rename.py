import os
from PIL import Image
from PIL.ExifTags import TAGS

# Convert an image file to JPG format
def convert_to_jpg(file_path):
    image = Image.open(file_path)
    rgb_image = image.convert("RGB")
    new_path = os.path.splitext(file_path)[0] + ".jpg"
    rgb_image.save(new_path, "JPEG")
    os.remove(file_path)
    return new_path

# Get the creation date of an image file
def get_exif_datetime(file_path):
    try:
        image = Image.open(file_path)
        exif_data = image._getexif()
        if exif_data:
            date_time = exif_data.get(36867) or exif_data.get(306)
            if date_time:
                return date_time
    except:
        pass
    return None

# Rename images in the 'images' folder based on the order of their creation date
def rename_images(order_asc=False):
    folder_path = 'images'
    if not os.path.exists(folder_path):
        os.makedirs(folder_path)
    
    file_list = os.listdir(folder_path)
    
    for filename in file_list:
        if not filename.lower().endswith('.jpg'):
            file_path = os.path.join(folder_path, filename)
            try:
                new_path = convert_to_jpg(file_path)
                print(f"Converted {filename} to {os.path.basename(new_path)}")
            except Exception as e:
                print(f"Failed to convert {filename} to JPG: {e}")

    file_list = os.listdir(folder_path)
    jpg_files = [f for f in file_list if f.lower().endswith('.jpg')]

    images_with_dates = []
    images_without_dates = []
    for filename in jpg_files:
        file_path = os.path.join(folder_path, filename)
        date_time = get_exif_datetime(file_path)
        if date_time:
            images_with_dates.append((filename, date_time))
        else:
            images_without_dates.append(filename)

    images_with_dates.sort(key=lambda x: x[1], reverse=not order_asc)

    temp_filenames = []
    index = 0
    for filename, _ in images_with_dates:
        src = os.path.join(folder_path, filename)
        temp_name = f"temp_{index}.jpg"
        temp_dst = os.path.join(folder_path, temp_name)
        os.rename(src, temp_dst)
        temp_filenames.append((temp_name, index))
        print(f"Renamed {filename} to {temp_name[5:]}")
        index += 1

    for filename in images_without_dates:
        src = os.path.join(folder_path, filename)
        temp_name = f"temp_{index}.jpg"
        temp_dst = os.path.join(folder_path, temp_name)
        os.rename(src, temp_dst)
        temp_filenames.append((temp_name, index))
        print(f"Renamed {filename} to {temp_name[5:]}")
        index += 1

    for temp_name, final_index in temp_filenames:
        temp_src = os.path.join(folder_path, temp_name)
        final_name = f"{final_index}.jpg"
        final_dst = os.path.join(folder_path, final_name)
        os.rename(temp_src, final_dst)

    print("Renaming completed!")

if __name__ == "__main__":
    order_asc = False
    rename_images(order_asc)
