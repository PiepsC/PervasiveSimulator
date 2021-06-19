# Importing Libraries
import tensorflow as tf
from tensorflow import keras
from PIL import Image
#from keras.preprocessing.image import array_to_img, img_to_array, load_img
from flask import Flask, request,jsonify
import io

new_model=keras.models.load_model('bat_model.h5') # loading the Image Classification model

image_size = (180, 180) 
batch_size = 32

app = Flask(__name__)

@app.route('/json', methods=['POST'])
def upload_file():
    
        image = request.data
        print(type(image))
        img=Image.open(io.BytesIO(image))
        img= img.resize((180, 180))
        img_array = keras.preprocessing.image.img_to_array(img)
        img_array = tf.expand_dims(img_array, 0)  # Create batch axis
        print(type(img_array))
        predictions = new_model.predict(img_array)
        score = predictions[0]
        score=100 * (1 - score), 100 * score
        print(score)
        score=str(score)
        score=score[8:16]  #Bat Confidence score
        score_int=int(float(score))
        print(type(score_int))
        print(score_int)
        
        if score_int > 40:  #Threshold to detect bat 
            response=True
        elif score_int < 40:
            response=False
              
        response_body = {
            "BAT":response,    
        }
        res = (jsonify(response_body), 200)
        return res

if __name__ == '__main__':
    # run app in debug mode on port 5000
    app.run(host="0.0.0.0",threaded=True)
