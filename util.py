import pandas
import json 

JSON_FILE = './out.json'
LOCATIONS_FILE = './location_input/locations.csv'

def json_to_csv_bank_location(): #google
	data = json.load(open(JSON_FILE))
	rows = []
	for i in data:
		for location in i['locations']:
			name = ' '.join(location.split(",", 2)[:2])
			address = ' '.join(location.split(",", 2)[2:])
			if address.count(',') > 3: #remove first comma for city
				address = address.replace(',', ' ', 1)
			if address.count(',') > 2:
				address = address.replace(',', ' ', 1)
			address_line1 = address.split(",", 1)[0]
			city_raw = address.split(",", 1)[1]
			city = city_raw.split(",", 1)[0]
			state_raw = city_raw.split(",", 1)[1]
			state = state_raw.split(" ", 1)[0]
			zipcode = state_raw.split(" ", 1)[1]
			row = {'name': name, 'address-line1': address_line1, 'city': city, 'state': state, 'zipcode': zipcode, 'country': 'US'}
			rows.append(row)

	df = pandas.DataFrame(rows)
	df.to_csv(LOCATIONS_FILE, index=False)


def json_to_csv_alexa():
	data = json.load(open(JSON_FILE))
	rows = []
	for i in data:
		country_ranking = i['ranks'][1]
		if '%' in country_ranking:
			country_ranking = None
		row = {'name': i['url'], 'global_ranking': i['ranks'][0], 'country_ranking': country_ranking, 'country': i['country']}
		rows.append(row)
	df = pandas.DataFrame(rows)


	df.to_csv(LOCATIONS_FILE, index=False)

json_to_csv_alexa()