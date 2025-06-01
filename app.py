from flask import Flask, render_template, jsonify, request
import json
import os
import math

app = Flask(__name__)

DATA_FILE = 'graph_data.json'

DEFAULT_DATA = {
    "cities": {
        'A': {'B': 10, 'C': 15},
        'B': {'A': 10, 'D': 12},
        'C': {'A': 15, 'D': 10, 'E': 8},
        'D': {'B': 12, 'C': 10, 'F': 5},
        'E': {'C': 8, 'F': 7},
        'F': {'D': 5, 'E': 7}
    },
    "heuristics": {
        'A': {'A': 0, 'B': 1, 'C': 2, 'D': 3, 'E': 4, 'F': 5},
        'B': {'A': 1, 'B': 0, 'C': 3, 'D': 2, 'E': 5, 'F': 4},
        'C': {'A': 2, 'B': 3, 'C': 0, 'D': 1, 'E': 2, 'F': 3},
        'D': {'A': 3, 'B': 2, 'C': 1, 'D': 0, 'E': 2, 'F': 1},
        'E': {'A': 4, 'B': 5, 'C': 2, 'D': 2, 'E': 0, 'F': 1},
        'F': {'A': 5, 'B': 4, 'C': 3, 'D': 1, 'E': 1, 'F': 0}
    },
    "positions": {
        'A': [100, 250],
        'B': [250, 150],
        'C': [250, 350],
        'D': [400, 250],
        'E': [550, 350],
        'F': [700, 250]
    },
    "heuristic_scale": 0
}

def load_data():
    if os.path.exists(DATA_FILE):
        try:
            with open(DATA_FILE, 'r') as f:
                data = json.load(f)
                if 'heuristic_scale' not in data:
                    data['heuristic_scale'] = 0
                return data
        except json.JSONDecodeError:
            print("Error decoding JSON from graph_data.json, using default data.")
            return DEFAULT_DATA
    return DEFAULT_DATA

def save_data(data):
    with open(DATA_FILE, 'w') as f:
        json.dump(data, f, indent=2)

def a_star(start, goal, heuristic_scale=0):
    data = load_data()
    cities = data["cities"]
    heuristics = data["heuristics"]

    open_set = {start}
    came_from = {}
    g_score = {city: float('inf') for city in cities}
    g_score[start] = 0
    f_score = {city: float('inf') for city in cities}
    
    h_start = heuristics.get(start, {}).get(goal, 0)
    if heuristic_scale != 0:
        h_start = h_start / heuristic_scale
    f_score[start] = h_start

    steps = []

    print(f"[A*] Mulai pencarian dari {start} ke {goal}")
    
    while open_set:
        current = min(open_set, key=lambda city: f_score[city])
        print(f"\n[A*] Menjelajahi node: {current}")
        print(f"  g({current}) = {g_score[current]}")
        
        h_current = heuristics.get(current, {}).get(goal, 0)
        if heuristic_scale != 0:
            h_current = h_current / heuristic_scale
        print(f"  h({current}) = {h_current}")
        print(f"  f({current}) = {f_score[current]}")
        
        explored_nodes = [current]
        explored_edges = []

        if current == goal:
            print("[A*] Tujuan ditemukan! Menyusun jalur...")
            path = reconstruct_path(came_from, current)
            print(f"[A*] Jalur akhir: {' → '.join(path)}")
            steps.append({'exploredNodes': explored_nodes, 'exploredEdges': explored_edges})
            return path, steps

        open_set.remove(current)

        for neighbor, cost in cities[current].items():
            tentative_g = g_score[current] + cost
            print(f"  Menilai tetangga {neighbor}:")
            print(f"    Biaya dari {current} ke {neighbor} = {cost}")
            print(f"    g({neighbor}) sekarang = {g_score[neighbor]}")
            print(f"    g({current}) + cost = {tentative_g}")
            if tentative_g < g_score[neighbor]:
                came_from[neighbor] = current
                g_score[neighbor] = tentative_g
                
                h = heuristics.get(neighbor, {}).get(goal, 0)
                if heuristic_scale != 0:
                    h = h / heuristic_scale
                f_score[neighbor] = tentative_g + h
                open_set.add(neighbor)
                print(f"    ✅ Jalur lebih baik ditemukan ke {neighbor}.")
                print(f"    g({neighbor}) = {tentative_g}, h({neighbor}) = {h}, f = {f_score[neighbor]}")
                explored_edges.append(f"{current}-{neighbor}")
            else:
                print(f"    ⛔ Jalur tidak lebih baik, abaikan.")

        steps.append({'exploredNodes': explored_nodes, 'exploredEdges': explored_edges})

    print("[A*] Tidak ada jalur yang ditemukan.")
    return None, steps

def reconstruct_path(came_from, current):
    path = [current]
    while current in came_from:
        current = came_from[current]
        path.append(current)
    return path[::-1]

def update_heuristics(data):
    positions = data["positions"]
    heuristics = {}

    for src in positions:
        heuristics[src] = {}
        for dest in positions:
            x1, y1 = positions[src]
            x2, y2 = positions[dest]
            distance = math.hypot(x2 - x1, y2 - y1)
            heuristics[src][dest] = round(distance, 2)

    data["heuristics"] = heuristics
    return data

@app.route('/')
def home():
    return render_template('index.html')

@app.route('/settings')
def settings():
    data = load_data()
    return render_template('settings.html',
                           cities=data["cities"],
                           heuristics=data["heuristics"],
                           positions=data["positions"],
                           heuristic_scale=data.get("heuristic_scale", 0))

@app.route('/find-path', methods=['POST'])
def find_path():
    data = request.json
    start = data['start']
    goal = data['end']
    heuristic_scale = data.get('heuristicScale', 0)
    
    path, steps = a_star(start, goal, heuristic_scale)
    if path:
        graph_data = load_data()
        cities = graph_data["cities"]
        distance = sum(cities[path[i]][path[i+1]] for i in range(len(path) - 1))
        return jsonify({'status': 'success', 'path': path, 'steps': steps, 'distance': distance})
    return jsonify({'status': 'error', 'message': 'Path not found'})

@app.route('/add-city', methods=['POST'])
def add_city():
    data = load_data()
    city_data = request.json
    new_city = city_data['name']

    if new_city in data["cities"]:
        return jsonify({'status': 'error', 'message': f'Kota dengan nama {new_city} sudah ada.'})

    # Validasi koneksi duplikat
    connections = {}
    for conn in city_data['connections']:
        if conn['city'] in connections:
            return jsonify({'status': 'error', 'message': f'Koneksi duplikat ke kota {conn["city"]} ditemukan.'})
        connections[conn['city']] = conn['distance']

    data["cities"][new_city] = {}
    data["positions"][new_city] = city_data['position']
    data["heuristics"][new_city] = {}

    for city in data["cities"]:
        if city != new_city:
            val = city_data['heuristics'].get(city, 0)
            data["heuristics"][new_city][city] = val
            data["heuristics"][city][new_city] = val

    for target, distance in connections.items():
        data["cities"][new_city][target] = distance
        if target not in data["cities"]:
            data["cities"][target] = {}
        data["cities"][target][new_city] = distance

    data = update_heuristics(data)
    save_data(data)
    return jsonify({'status': 'success'})

@app.route('/edit-city', methods=['POST'])
def edit_city():
    data = load_data()
    city_data = request.json
    city_name = city_data['name']

    # Validasi koneksi duplikat
    connections = {}
    for conn in city_data['connections']:
        if conn['city'] in connections:
            return jsonify({'status': 'error', 'message': f'Koneksi duplikat ke kota {conn["city"]} ditemukan.'})
        connections[conn['city']] = conn['distance']
    
    data["positions"][city_name] = city_data['position']

    for city, val in city_data['heuristics'].items():
        data["heuristics"].setdefault(city_name, {})[city] = val
        data["heuristics"].setdefault(city, {})[city_name] = val

    # Hapus koneksi lama
    for target in list(data["cities"][city_name].keys()):
        if city_name in data["cities"].get(target, {}):
            del data["cities"][target][city_name]

    # Tambahkan koneksi baru
    data["cities"][city_name] = {}
    for target, distance in connections.items():
        data["cities"][city_name][target] = distance
        if target not in data["cities"]:
            data["cities"][target] = {}
        data["cities"][target][city_name] = distance

    data = update_heuristics(data)
    save_data(data)
    return jsonify({'status': 'success'})

@app.route('/delete-city', methods=['POST'])
def delete_city():
    data = load_data()
    city_name = request.json['name']

    data["cities"].pop(city_name, None)
    data["heuristics"].pop(city_name, None)
    data["positions"].pop(city_name, None)

    for city in data["cities"]:
        data["cities"][city].pop(city_name, None)
    for city in data["heuristics"]:
        data["heuristics"][city].pop(city_name, None)

    data = update_heuristics(data)
    save_data(data)
    return jsonify({'status': 'success'})

@app.route('/get-graph-data', methods=['GET'])
def get_graph_data():
    data = load_data()
    return jsonify({
        'cities': data["cities"],
        'positions': data["positions"]
    })

@app.route('/get-full-graph-data', methods=['GET'])
def get_full_graph_data():
    data = load_data()
    heuristic_scale = data.get("heuristic_scale", 0)
    scaled_heuristics = {}
    for city, heuristics_for_city in data["heuristics"].items():
        scaled_heuristics[city] = {}
        for dest, heuristic_val in heuristics_for_city.items():
            if heuristic_scale != 0:
                scaled_heuristics[city][dest] = round(heuristic_val / heuristic_scale, 2)
            else:
                scaled_heuristics[city][dest] = heuristic_val
    return jsonify({
        'cities': data["cities"],
        'positions': data["positions"],
        'heuristics': data["heuristics"],
        'heuristic_scale': heuristic_scale,
        'scaled_heuristics': scaled_heuristics
    })

@app.route('/save-heuristic-scale', methods=['POST'])
def save_heuristic_scale():
    data = load_data()
    scale = request.json.get('scale', 0)
    data['heuristic_scale'] = int(scale)
    save_data(data)
    return jsonify({'status': 'success'})

if __name__ == '__main__':
    app.run(debug=True)