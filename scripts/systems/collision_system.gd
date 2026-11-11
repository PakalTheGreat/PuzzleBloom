class_name CollisionSystem
extends Node

## Resolves projectile ↔ block hits and flood-fill match groups.

const MATCH_MIN := 2 ## projectile + 1 neighbor OR 2+ connected same color after settle
const NEIGHBOR_DIST := 96.0


func find_cluster(origin: BlockEntity, all_blocks: Array[BlockEntity]) -> Array[BlockEntity]:
	var result: Array[BlockEntity] = []
	if origin == null or not is_instance_valid(origin) or origin.is_queued_for_deletion():
		return result
	var target_color := origin.bloom_color
	var open: Array[BlockEntity] = [origin]
	var seen: Dictionary = {}
	seen[origin.get_instance_id()] = true
	while not open.is_empty():
		var cur: BlockEntity = open.pop_back()
		result.append(cur)
		for other in all_blocks:
			if other == null or not is_instance_valid(other):
				continue
			if other.is_queued_for_deletion() or other.is_destroying:
				continue
			var oid := other.get_instance_id()
			if seen.has(oid):
				continue
			if other.bloom_color != target_color:
				continue
			if cur.global_position.distance_to(other.global_position) <= NEIGHBOR_DIST:
				seen[oid] = true
				open.append(other)
	return result

func find_aoe_neighbors(origin: BlockEntity, all_blocks: Array[BlockEntity], radius: float = 110.0) -> Array[BlockEntity]:
	var result: Array[BlockEntity] = []
	if origin == null:
		return result
	for other in all_blocks:
		if other == null or not is_instance_valid(other):
			continue
		if other == origin or other.is_queued_for_deletion() or other.is_destroying:
			continue
		if origin.global_position.distance_to(other.global_position) <= radius:
			result.append(other)
	return result

func settle_matches(all_blocks: Array[BlockEntity]) -> Array:
	## Returns array of clusters (each Array[BlockEntity]) sized >= 3 after gravity settle.
	var visited: Dictionary = {}
	var clusters: Array = []
	for b in all_blocks:
		if b == null or not is_instance_valid(b) or b.is_queued_for_deletion() or b.is_destroying:
			continue
		var id := b.get_instance_id()
		if visited.has(id):
			continue
		var cluster := find_cluster(b, all_blocks)
		for c in cluster:
			visited[c.get_instance_id()] = true
		if cluster.size() >= 3:
			clusters.append(cluster)
	return clusters
