from flask import Flask, render_template, jsonify, request

app = Flask(__name__)

# Contoh graf kota (bisa diganti dengan data sebenarnya)
cities = {
    'A': {'B': 10, 'C': 15},
    'B': {'A': 10, 'D': 12},
    'C': {'A': 15, 'D': 10, 'E': 8},
    'D': {'B': 12, 'C': 10, 'F': 5},
    'E': {'C': 8, 'F': 7},
    'F': {'D': 5, 'E': 7}
}

def a_star(start, goal):
    # Implementasi algoritma A* yang mengembalikan langkah-langkah
    open_set = {start}
    came_from = {}
    g_score = {city: float('inf') for city in cities}
    g_score[start] = 0
    f_score = {city: float('inf') for city in cities}
    f_score[start] = heuristic(start, goal)
    
    # Untuk menyimpan langkah-langkah eksplorasi
    steps = []
    
    while open_set:
        current = min(open_set, key=lambda city: f_score[city])
        
        # Catat node yang sedang dieksplorasi
        explored_nodes = [current]
        explored_edges = []
        
        if current == goal:
            path = reconstruct_path(came_from, current)
            # Tambahkan langkah terakhir
            steps.append({
                'exploredNodes': explored_nodes,
                'exploredEdges': explored_edges
            })
            return path, steps
        
        open_set.remove(current)
        
        for neighbor, cost in cities[current].items():
            tentative_g = g_score[current] + cost
            
            if tentative_g < g_score[neighbor]:
                came_from[neighbor] = current
                g_score[neighbor] = tentative_g
                f_score[neighbor] = g_score[neighbor] + heuristic(neighbor, goal)
                
                if neighbor not in open_set:
                    open_set.add(neighbor)
                
                # Catat edge yang dieksplorasi
                explored_edges.append(f"{current}-{neighbor}")
        
        # Simpan langkah saat ini
        steps.append({
            'exploredNodes': explored_nodes,
            'exploredEdges': explored_edges
        })
    
    return None, steps

def heuristic(city, goal):
    # Heuristik sederhana (bisa diganti dengan jarak sebenarnya)
    distances = {'A': 0, 'B': 1, 'C': 2, 'D': 3, 'E': 4, 'F': 5}
    return abs(distances[city] - distances[goal])

def reconstruct_path(came_from, current):
    path = [current]
    while current in came_from:
        current = came_from[current]
        path.append(current)
    return path[::-1]

@app.route('/')
def home():
    return render_template('index.html')

@app.route('/find-path', methods=['POST'])
def find_path():
    data = request.json
    start = data['start']
    goal = data['end']
    
    path, steps = a_star(start, goal)
    if path:
        distance = sum(cities[path[i]][path[i+1]] for i in range(len(path)-1))
        return jsonify({
            'status': 'success',
            'path': path,
            'steps': steps,
            'distance': distance
        })
    else:
        return jsonify({'status': 'error', 'message': 'Path not found'})

if __name__ == '__main__':
    app.run(debug=True)