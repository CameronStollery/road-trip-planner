# from __future__ import print_function
import pymzn
import time
from pprint import pprint
from collections import OrderedDict

import openrouteservice
from openrouteservice.geocode import pelias_search
from openrouteservice.distance_matrix import distance_matrix

client = openrouteservice.Client(key='')
# routes = client.directions(coords)

# print(routes)


def geocode(address):
    return pelias_search(client, address, size = 1)


def matrix(coordinates):
    # query = {'locations': coordinates, 'metrics': ['duration']}
    return distance_matrix(client, coordinates)


# TODO add error classes for distance matrix errors etc


def test_matrix():
    request = {'locations': [[8.34234,48.23424],[8.34423,48.26424], [8.34523,48.24424], [8.41423,48.21424]],
           'profile': 'driving-car',
           'metrics': ['duration']}
    
    return distance_matrix(client, [[8.34234,48.23424],[8.34423,48.26424], [8.34523,48.24424], [8.41423,48.21424]])

def compute_results(form_input):
    details = OrderedDict()     # A fixed order of the entities is needed for distance matrix calls

    for item in form_input:
        [field_type, entity] = item.split('-')
        value = form_input[item]
        if entity not in details:
            details[entity] = {}
        details[entity][field_type] = value
    
    pprint(details)

    for entity in details:
        # Get missing coordinates and well-formatted address using openrouteservice API
        if details[entity]['coords'] == '':
            loc = geocode(details[entity]['addr'])
            details[entity]['coords'] = loc['features'][0]['geometry']['coordinates']
            details[entity]['addr'] = loc_details['features'][0]['properties']['label']
        # Otherwise, convert coordinates from string into list of floats and put lng before lat for ORS compatibility
        else:
            details[entity]['coords'] = (details[entity]['coords'][1:len(details[entity]['coords']) - 1].split(', '))[::-1]

    print('FILLED IN MISSING COORDS')
    pprint(details)

    coordinates_list = []
    for entity_value in details.values():
        coordinates_list.append(entity_value['coords'])
    durations = matrix(coordinates_list)
    print('DURATIONS:')
    pprint(durations)

    for i, entity_value in enumerate(details.values()):
        entity_value['matrix-durations'] = durations['durations'][i]

    print('Updated details:')
    pprint(details)

    # MiniZinc test code
    try:
        solns = pymzn.minizinc('minizinc-test.mzn', 'minizinc-test.dzn', data={'capacity': 20})
        pprint(solns)
    except:
        print('Minizinc didn\'t work lol')

    # details.append(solns)

    return details

if __name__ == '__main__':
    """
    This just contains testing code. Delete before deploying to production environment. Code in this file shoudl only
    be accessed through the compute_results function.
    """
    loc_details = geocode('5 Bolinda Pl')
    print(loc_details['features'][0]['geometry']['coordinates'])
    print(loc_details['features'][0]['properties']['label'])
    # compute_results(test_input)
    # pprint(test_matrix())
    # people = []
    # # Prompt user to enter all names and addresses
    # personId = 1
    # name = ""
    # while name != "DONE":
    #     name = input("Enter the name of person " + str(personId) + " or type \"DONE\" when you have entered everyone.")
    #     if name != "DONE":
    #         address = input("Enter their address: ")
    #         loc = geocode(address)
    #         # pprint(loc)
    #         people.append({'id': personId, 'address': address, 'coords': loc['features'][0]['geometry']['coordinates']})
    #         personId += 1

    # if people == []:
    #     print("You haven't entered any addresses.")
    # else:
    #     coordinates = []
    #     for person in people:
    #         coordinates.append(person['coords'])
    #     # print(coordinates)
    #     distances = matrix(coordinates)
    #     # distances = testMatrix()
    #     pprint(distances)