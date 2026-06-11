import logging
from supabase import create_client, Client
from backend import config

logger = logging.getLogger(__name__)

supabase_client: Client = create_client(config.SUPABASE_URL, config.SUPABASE_SERVICE_ROLE_KEY)

class SupabaseCollectionWrapper:
    def __init__(self, table_name: str):
        self.table_name = table_name

    def _map_doc(self, doc):
        if doc is None:
            return None
        doc = dict(doc)
        if "id" in doc:
            doc["_id"] = str(doc["id"])
        return doc

    async def find_one(self, query: dict):
        q = supabase_client.table(self.table_name).select("*")
        for k, v in query.items():
            if k == "id":
                q = q.eq("id", v)
            else:
                q = q.eq(k, v)
        res = q.execute()
        if res.data:
            return self._map_doc(res.data[0])
        return None

    def find(self, query: dict):
        class Cursor:
            def __init__(self, table_name, query, mapper):
                self.table_name = table_name
                self.query = query
                self.sort_col = None
                self.sort_desc = False
                self.mapper = mapper
                self.offset_val = 0

            def sort(self, field, direction=1):
                if field == "_id":
                    field = "id"
                self.sort_col = field
                self.sort_desc = (direction == -1)
                return self

            def skip(self, offset: int):
                self.offset_val = offset
                return self

            async def to_list(self, limit: int = 100):
                q = supabase_client.table(self.table_name).select("*")
                for k, v in self.query.items():
                    if k == "id":
                        q = q.eq("id", v)
                    else:
                        q = q.eq(k, v)
                if self.sort_col:
                    q = q.order(self.sort_col, desc=self.sort_desc)
                
                # Apply offset and limit
                # supabase-py doesn't have offset directly but we can use range
                start = self.offset_val
                end = start + limit - 1
                q = q.range(start, end)
                
                res = q.execute()
                return [self.mapper(doc) for doc in res.data]

        return Cursor(self.table_name, query, self._map_doc)

    async def insert_one(self, document: dict):
        doc_to_insert = {}
        for k, v in document.items():
            if k == "_id":
                continue
            if k == "project_id" and v == "":
                v = None
            doc_to_insert[k] = v
        if "user_id" in doc_to_insert:
            doc_to_insert["user_id"] = str(doc_to_insert["user_id"])
        res = supabase_client.table(self.table_name).insert(doc_to_insert).execute()
        if res.data:
            document["_id"] = str(res.data[0].get("id"))
            document["id"] = str(res.data[0].get("id"))
        return res

    async def update_one(self, query: dict, update: dict):
        set_data = update.get("$set", {})
        doc_to_update = {}
        for k, v in set_data.items():
            if k == "_id":
                continue
            if k == "project_id" and v == "":
                v = None
            doc_to_update[k] = v
        q = supabase_client.table(self.table_name).update(doc_to_update)
        for k, v in query.items():
            if k == "id":
                q = q.eq("id", v)
            else:
                q = q.eq(k, v)
        res = q.execute()
        return res

    async def delete_one(self, query: dict):
        q = supabase_client.table(self.table_name).delete()
        for k, v in query.items():
            if k == "id":
                q = q.eq("id", v)
            else:
                q = q.eq(k, v)
        res = q.execute()
        class DeleteResult:
            def __init__(self, count):
                self.deleted_count = count
        return DeleteResult(len(res.data) if res.data else 0)

    async def count_documents(self, query: dict):
        q = supabase_client.table(self.table_name).select("id", count="exact")
        for k, v in query.items():
            if k == "id":
                q = q.eq("id", v)
            else:
                q = q.eq(k, v)
        res = q.execute()
        return res.count if res.count is not None else 0

    async def create_index(self, *args, **kwargs):
        pass

class MockDatabase:
    def __init__(self):
        self.projects = SupabaseCollectionWrapper("ghostboard_projects")
        self.sprint_tasks = SupabaseCollectionWrapper("ghostboard_tasks")
        self.memory_docs = SupabaseCollectionWrapper("ghostboard_memory_docs")
        self.ai_queries = SupabaseCollectionWrapper("ghostboard_ai_queries")
        self.users = SupabaseCollectionWrapper("ghostboard_users")

db = MockDatabase()
