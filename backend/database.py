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
        try:
            q = supabase_client.table(self.table_name).select("*")
            for k, v in query.items():
                if k == "id":
                    q = q.eq("id", v)
                else:
                    q = q.eq(k, v)
            res = q.execute()
            if res.data:
                return self._map_doc(res.data[0])
        except Exception as e:
            logger.error(f"Error in find_one for table {self.table_name}: {e}")
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

    async def insert_many(self, documents: list):
        """Insert many rows in a single request so a batch either lands
        together or fails together (no half-written set)."""
        docs_to_insert = []
        for document in documents:
            doc = {}
            for k, v in document.items():
                if k == "_id":
                    continue
                if k == "project_id" and v == "":
                    v = None
                doc[k] = v
            if "user_id" in doc:
                doc["user_id"] = str(doc["user_id"])
            docs_to_insert.append(doc)
        res = supabase_client.table(self.table_name).insert(docs_to_insert).execute()
        if res.data:
            for document, row in zip(documents, res.data):
                document["_id"] = str(row.get("id"))
                document["id"] = str(row.get("id"))
        return res

    async def update_one(self, query: dict, update: dict):
        try:
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
        except Exception as e:
            logger.error(f"Error in update_one for table {self.table_name}: {e}")
            class FakeRes:
                data = []
            return FakeRes()

    async def delete_one(self, query: dict):
        try:
            q = supabase_client.table(self.table_name).delete()
            for k, v in query.items():
                if k == "id":
                    q = q.eq("id", v)
                else:
                    q = q.eq(k, v)
            res = q.execute()
            count = len(res.data) if res.data else 0
        except Exception as e:
            logger.error(f"Error in delete_one for table {self.table_name}: {e}")
            count = 0
        class DeleteResult:
            def __init__(self, count):
                self.deleted_count = count
        return DeleteResult(count)

    async def count_documents(self, query: dict):
        try:
            q = supabase_client.table(self.table_name).select("id", count="exact")
            for k, v in query.items():
                if k == "id":
                    q = q.eq("id", v)
                else:
                    q = q.eq(k, v)
            res = q.execute()
            return res.count if res.count is not None else 0
        except Exception as e:
            logger.error(f"Error in count_documents for table {self.table_name}: {e}")
            return 0

    async def create_index(self, *args, **kwargs):
        pass

class MockDatabase:
    def __init__(self):
        self.projects = SupabaseCollectionWrapper("archon_projects")
        self.sprint_tasks = SupabaseCollectionWrapper("archon_tasks")
        self.memory_docs = SupabaseCollectionWrapper("archon_memory_docs")
        self.ai_queries = SupabaseCollectionWrapper("archon_ai_queries")
        self.users = SupabaseCollectionWrapper("archon_users")

db = MockDatabase()
