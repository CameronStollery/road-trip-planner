from flask import Flask, render_template, request, url_for

application = Flask(__name__)

@application.route('/')
def index():
    return render_template('index.html')

@application.route('/results')
def results():
    return render_template('results.html')

if __name__ == "__main__":
    # Setting debug to True enables debug output. This line should be
    # removed before deploying a production app.
    application.debug = True
    application.run()