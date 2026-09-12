class InvalidTicketTransitionError(Exception):
    def __init__(self, current_status:str,new_status:str):
        self.current_status = current_status
        self.new_status = new_status

        super().__init__(
            f"Cannot transition ticket from "
            f"{current_status} to {new_status}"
        )