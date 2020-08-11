from __future__ import print_function
import pymzn
import time
import locationiq
from locationiq.rest import ApiException

# LocationIQ configuration
configuration = locationiq.Configuration()
# Configure API key authorization: key
configuration.api_key['key'] = 'pk.fcb2492d75af6890e946efec0f906611'
# Uncomment below to setup prefix (e.g. Bearer) for API key, if needed
# configuration.api_key_prefix['key'] = 'Bearer'
# Defining host is optional and default to https://eu1.locationiq.com/v1
configuration.host = "https://us1.locationiq.com/v1"
# Enter a context with an instance of the API 

def geocode(address):
    with locationiq.ApiClient(configuration) as api_client:
        # Create an instance of the API class
        api_instance = locationiq.SearchApi(api_client)
    q = address # str | Address to geocode
    format = 'json' # str | Format to geocode. Only JSON supported for SDKs
    normalizecity = 1 # int | For responses with no city value in the address section, the next available element in this order - city_district, locality, town, borough, municipality, village, hamlet, quarter, neighbourhood - from the address section will be normalized to city. Defaults to 1 for SDKs.
    addressdetails = 1 # int | Include a breakdown of the address into elements. Defaults to 0. (optional)
    limit = 1 # int | Limit the number of returned results. Default is 10. (optional) (default to 10)
    accept_language = 'native' # str | Preferred language order for showing search results, overrides the value specified in the Accept-Language HTTP header. Defaults to en. To use native language for the response when available, use accept-language=native (optional)
    dedupe = 1 # int | Sometimes you have several objects in OSM identifying the same place or object in reality. The simplest case is a street being split in many different OSM ways due to different characteristics. Nominatim will attempt to detect such duplicates and only return one match; this is controlled by the dedupe parameter which defaults to 1. Since the limit is, for reasons of efficiency, enforced before and not after de-duplicating, it is possible that de-duplicating leaves you with less results than requested. (optional)
    try:
        # Forward Geocoding
        api_response = api_instance.search(q, format, normalizecity, addressdetails=addressdetails, limit=limit, accept_language=accept_language, dedupe=dedupe)
        return api_response[0]  # Return first address found for given string
    except ApiException as e:
        raise e

def matrix(coordinates):
    with locationiq.ApiClient(configuration) as api_client:
        # Create an instance of the API class
        api_instance = locationiq.MatrixApi(api_client)
    try:
        api_response = api_instance.matrix(coordinates)
        return api_response
    except ApiException as e:
        raise e

def testMatrix():
    with locationiq.ApiClient(configuration) as api_client:
    # Create an instance of the API class
        api_instance = locationiq.MatrixApi(api_client)
        coordinates = '-0.16102,51.523854;-0.15797,51.52326;-0.161593,51.522550' # str | String of format {longitude},{latitude};{longitude},{latitude}[;{longitude},{latitude} ...] or polyline({polyline}) or polyline6({polyline6}). polyline follows Google's polyline format with precision 5
    annotations = 'duration' # str | Returns additional metadata for each coordinate along the route geometry.  [ true, false (default), nodes, distance, duration, datasources, weight, speed ] (optional)
    fallback_speed = 25.65 # float | If no route found between a source/destination pair, calculate the as-the-crow-flies distance,  then use this speed to estimate duration. double > 0 (optional)

    try:
    # Matrix Service
        api_response = api_instance.matrix(
            coordinates=coordinates,
            annotations=annotations,
            fallback_speed=fallback_speed)
        # api_response = api_instance.matrix(coordinates)
        return api_response
    except ApiException as e:
        print("Exception when calling MatrixApi->matrix: %s\n" % e)

print(testMatrix())

# if __name__ == '__main__':
#     people = []
#     # Prompt user to enter all names and addresses
#     personId = 1
#     name = ""
#     while name != "DONE":
#         name = input("Enter the name of person " + str(personId) + " or type \"DONE\" when you have entered everyone.")
#         if name != "DONE":
#             address = input("Enter their address: ")
#             loc = geocode(address)
#             people.append({'id': personId, 'address': address, 'lat': loc.lat, 'lon': loc.lon})
#             personId += 1

#     if people == []:
#         print("You haven't entered any addresses.")
#     else:
#         coordinates = "{},{}".format(people[0]['lat'], people[0]['lon'])
#         for person in people[1:]:
#             coordinates += ";{},{}".format(person['lat'], person['lon'])
#         distance_matrix = matrix(coordinates)
#         # distance_matrix = testMatrix()
#         print(distance_matrix)


# MiniZinc test code

import pymzn
solns = pymzn.minizinc('model.mzn', 'model.dzn', data={'capacity': 20})
print(solns)