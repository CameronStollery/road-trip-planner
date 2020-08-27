from flask import Flask, render_template, request, url_for
from werkzeug.datastructures import ImmutableOrderedMultiDict
import backend

application = Flask(__name__)

@application.route('/')
def index():
    return render_template('index.html')

@application.route('/results', methods = ['POST'])
def results():
    results = backend.compute_results(request.form)
    return render_template('results.html', text = results)

if __name__ == "__main__":
    # Setting debug to True enables debug output. This line should be
    # removed before deploying a production app.
    application.debug = True
    application.run()