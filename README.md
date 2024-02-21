<li>
    Step 1. Node version: 16.20.2
Step 2. Open seqConfig.js and change your username and password of your DB. Please change the dialect to your preferred DB.
Step 3. Make sure you have sampel directory in the project folder.
Step 4. Run npm start in the terminal to start the background task.
</li>

API Details:

<table>
<thead>
    <tr>
    <th>Route</th>
    <th>Method</th>
    <th>Body</th>
    <th>Sample Response</th>
    </tr>
</thead>
<tbody>
    <tr>
        <td>"/"</td>
        <td>post</td>
        <td><code>{"directory": "./sampledirectory","findString": "hello","frequency": 10000, "startStop": "start"}</code></td>
        <td><code>"background task is running in scheduled interval"</code></td>
    </tr>
    <tr>
        <td>/gettaskdetails</td>
        <td>get</td>
        <td></td>
        <td>
        <code>
        {
        "seq_id": 1,
        "magic_string_count": 3,
        "task_start_time": "2024-02-21T05:13:15.000Z",
        "task_end_time": "2024-02-21T05:13:18.000Z",
        "task_total_time": null,
        "files_list": "sampledirectory\\hi.txt,sampledirectory\\sample.txt,sampledirectory\\sample2.txt",
        "files_added_paths": null,
        "files_deleted_paths": null,
        "task_status": "success",
        "createdAt": "2024-02-21T10:43:15.000Z",
        "updatedAt": "2024-02-21T10:43:15.000Z"
        }
        </code></td>
    </tr>
</tbody>
</table>
